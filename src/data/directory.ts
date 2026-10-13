// The blog's folder tree — the spine of every page. Posts live in exactly one
// folder (`location`) and may be cross-listed in others (`alsoIn`); both are
// paths into this tree, e.g. "fuzzing-testing/fuzzing".
//
// Folder names and blurbs are from the Figma directory boards. Post counts are
// never written here: lib/blog.ts derives them from the posts collection.

export interface Folder {
  /** Path segment, kebab-case. */
  slug: string;
  /** One-line summary shown in the folder header and subfolder rows. */
  blurb?: string;
  /** Display title for the folder page; falls back to the slug. */
  title?: string;
  children?: Folder[];
}

export interface FolderGroup {
  /** Uppercase heading in the tree. */
  label: string;
  /** Index groups are cross-cutting lists, marked @ in the tree (ls -F symlink). */
  kind: "topic" | "index" | "about";
  folders: Folder[];
}

export const directory: FolderGroup[] = [
  {
    label: "Topics",
    kind: "topic",
    folders: [
      {
        slug: "ai",
        title: "AI",
        blurb: "Machine learning security, AI-assisted auditing and agent tooling.",
        children: [
          { slug: "machine-learning", title: "Machine learning" },
          { slug: "agents-mcp", title: "Agents & MCP" },
        ],
      },
      { slug: "blockchain", title: "Blockchain", blurb: "Smart contracts, DeFi protocols and the tools we use to audit them." },
      {
        slug: "cryptography",
        title: "Cryptography",
        blurb: "Applied cryptography, protocol reviews and post-quantum migration.",
        children: [
          { slug: "post-quantum", title: "Post-quantum" },
          { slug: "zero-knowledge", title: "Zero-knowledge" },
          { slug: "confidential-computing", title: "Confidential computing" },
        ],
      },
      {
        slug: "program-analysis",
        title: "Program analysis",
        blurb: "Static and dynamic analysis, symbolic execution and reverse engineering.",
        children: [{ slug: "reverse-engineering", title: "Reverse engineering" }],
      },
      {
        slug: "fuzzing-testing",
        title: "Fuzzing & testing",
        blurb:
          "Coverage-guided, snapshot, differential and smart-contract fuzzing, plus mutation testing and the benchmarks behind our tools.",
        children: [
          { slug: "fuzzing", title: "Fuzzing", blurb: "coverage-guided, snapshot, differential and smart-contract fuzzing" },
          { slug: "mutation-testing", title: "Mutation testing", blurb: "finding the gaps your test suite misses" },
        ],
      },
      { slug: "compilers", title: "Compilers", blurb: "Compiler internals, LLVM and the security properties of generated code." },
      {
        slug: "vulnerabilities",
        title: "Vulnerabilities",
        blurb: "Bugs we found, how we exploited them and how they were fixed.",
        children: [
          { slug: "exploits", title: "Exploits" },
          { slug: "disclosures", title: "Disclosures" },
        ],
      },
      {
        slug: "secure-engineering",
        title: "Secure engineering",
        blurb: "Building software that stays secure: AppSec, supply chain and assurance.",
        children: [
          { slug: "appsec", title: "AppSec" },
          { slug: "supply-chain", title: "Supply chain" },
          { slug: "assurance", title: "Assurance" },
        ],
      },
      { slug: "systems", title: "Systems", blurb: "Operating systems, firmware, hardware and the layers between." },
    ],
  },
  {
    label: "Indexes",
    kind: "index",
    folders: [
      { slug: "tools", title: "Tools", blurb: "Every post that ships or extends one of our open-source tools." },
      { slug: "languages", title: "Languages", blurb: "Posts grouped by the language they target.", children: [{ slug: "go", title: "Go" }] },
      {
        slug: "programs",
        title: "Programs",
        blurb: "Long-running initiatives and research programs.",
        children: [{ slug: "patch-the-planet", title: "Patch the Planet" }],
      },
    ],
  },
  {
    label: "About",
    kind: "about",
    folders: [{ slug: "company", title: "Company", blurb: "News from Trail of Bits: people, events and announcements." }],
  },
];

/** Post types, in filter-bar order. */
export const postTypes = ["post", "release", "guide", "essay", "talk", "news", "review", "log"] as const;
export type PostType = (typeof postTypes)[number];
