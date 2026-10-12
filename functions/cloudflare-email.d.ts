// `cloudflare:email` is a workerd runtime module, not an npm package. Types for
// it reach `src/` through the `astro/client` reference in src/env.d.ts, but
// files under functions/ sit outside that graph and don't see them — so a
// `cloudflare:email` import there fails with ts(2307).
//
// Declaring just the surface we use keeps functions/ type-checked without
// depending on the Cloudflare adapter staying installed (the static build
// doesn't use it).
declare module "cloudflare:email" {
  export class EmailMessage {
    constructor(from: string, to: string, raw: string);
  }
}
