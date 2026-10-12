// Cloudflare Pages Function — POST /api/contact
//
// The reference form backend. It lives OUTSIDE the Astro build (in /functions),
// so the site stays a pure static build and keeps build-time image
// optimization — no adapter needed. Cloudflare runs this server-side next to
// the static assets.
//
// `Form.astro` POSTs FormData here and treats any 2xx as success.
//
// This implements the endpoint half of the forms rule. What it does NOT do,
// because code in an edge function cannot:
//
//   RATE LIMITING is platform-level. Edge isolates are per-colo and ephemeral,
//   so an in-memory counter here would reset constantly and count nothing —
//   worse than none, because it looks like protection. Configure a Cloudflare
//   WAF rate-limiting rule on /api/* (or the equivalent on your host) and
//   verify it before launch. The launch audit marks this NEEDS HUMAN.
//
//   ALERTING needs a destination. Every failure path below logs with the
//   `[contact:error]` prefix; point a log drain or alert at that string so a
//   silently-broken form surfaces. A form that stops delivering without anyone
//   noticing is the expensive failure here, not a bounced submission.

interface SendEmailBinding {
  send(message: unknown): Promise<void>;
}

interface Env {
  /** Production origin. Submissions from any other origin are rejected. */
  ALLOWED_ORIGIN?: string;
  NOTIFY_TO?: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string;
  /** Cloudflare Email Routing `send_email` binding. Absent = log-only mode. */
  NOTIFY_EMAIL?: SendEmailBinding;
}

/** Reject oversized bodies before reading them into memory. */
const MAX_BODY_BYTES = 16 * 1024;

/** Per-field caps. Anything longer is a bot or an attack, not a person. */
const LIMITS: Record<string, number> = {
  firstName: 100,
  lastName: 100,
  email: 254, // RFC 5321 maximum
  message: 5000,
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * Strip CR/LF before any value reaches a mail header. Without this, a name
 * containing a newline injects arbitrary headers — an extra Bcc, a forged
 * Reply-To — into the message. Applies to everything interpolated into a
 * header, never just the obvious fields.
 */
const headerSafe = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

/** Field value, trimmed and length-capped. Returns null when over the cap. */
const field = (form: FormData, name: string): string | null => {
  const value = String(form.get(name) ?? "").trim();
  const limit = LIMITS[name] ?? 500;
  return value.length > limit ? null : value;
};

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const { request, env } = context;

  // ── Origin check — the CSRF strategy for a same-origin form ──────────────
  // A browser always sends Origin on a cross-origin POST, so a mismatch means
  // the request did not come from our page. Falls back to this deployment's
  // own origin when ALLOWED_ORIGIN isn't set, which keeps previews working.
  const expected = env.ALLOWED_ORIGIN ?? new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== expected) {
    console.warn(`[contact:rejected] cross-origin submission from ${origin}`);
    return json({ ok: false, error: "Submission rejected." }, 403);
  }

  // ── Size cap ─────────────────────────────────────────────────────────────
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Submission too large." }, 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "Invalid form submission." }, 400);
  }

  // ── Honeypot ─────────────────────────────────────────────────────────────
  // Form.astro renders a hidden field (default name `website`). Bots fill it;
  // humans never see it. Report success and send nothing — telling a bot it
  // was caught just teaches it to stop filling the field.
  if (String(form.get("website") ?? "")) return json({ ok: true });

  // ── Validation ───────────────────────────────────────────────────────────
  const firstName = field(form, "firstName");
  const lastName = field(form, "lastName");
  const email = field(form, "email");
  const message = field(form, "message");

  const overLimit = firstName === null || lastName === null || email === null || message === null;
  if (overLimit) {
    return json({ ok: false, error: "One of the fields is too long." }, 422);
  }

  const emailLooksValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (!firstName || !lastName || !emailLooksValid) {
    return json(
      { ok: false, error: "Please provide your name and a valid email." },
      422,
    );
  }

  // ── Compose ──────────────────────────────────────────────────────────────
  const subject = headerSafe(`New contact: ${firstName} ${lastName}`);
  const body = [
    `Name:  ${firstName} ${lastName}`,
    `Email: ${email}`,
    message ? `\n${message}` : "",
    ``,
    `Submitted: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  // ── Deliver ──────────────────────────────────────────────────────────────
  // Log-only until the binding exists, so the form works end-to-end from the
  // first deploy. Note what is NOT logged: no name, address or message body.
  // Submission content is personal data — it belongs in the notification, not
  // in a log store with an unbounded retention window.
  if (!env.NOTIFY_EMAIL || !env.FROM_EMAIL || !env.NOTIFY_TO) {
    console.log("[contact] received; email binding not configured, nothing sent");
    return json({ ok: true });
  }

  try {
    // Imported here rather than at module scope so a deployment without Email
    // Routing configured still builds and serves.
    const { EmailMessage } = await import("cloudflare:email");

    const from = headerSafe(env.FROM_EMAIL);
    const to = headerSafe(env.NOTIFY_TO);
    const fromName = headerSafe(env.FROM_NAME ?? "Website");

    // Hand-rolled RFC 5322. Deliberately not `mimetext`: its default build
    // fails esbuild on node built-ins, and `mimetext/browser` builds but throws
    // at runtime in workerd. The message we need is a few lines of text.
    const raw = [
      `From: ${fromName} <${from}>`,
      `To: ${to}`,
      `Reply-To: ${headerSafe(email)}`,
      `Subject: ${subject}`,
      `Message-ID: <${crypto.randomUUID()}@${from.split("@")[1]}>`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      body,
    ].join("\r\n");

    await env.NOTIFY_EMAIL.send(new EmailMessage(from, to, raw));
  } catch (error) {
    // Alert on this prefix. A form that silently stops delivering is the
    // failure that costs a client real leads.
    console.error("[contact:error] send failed:", error);
    return json({ ok: false, error: "Could not send. Please try again." }, 502);
  }

  return json({ ok: true });
};
