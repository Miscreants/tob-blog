// `@fontsource-variable/*` packages ship CSS only — no type declarations — so a
// side-effect import (`import "@fontsource-variable/inter";`) fails `astro check`
// with ts(2882). Declaring the namespace as an untyped module is the documented
// fix and keeps the import checked for existence without inventing types.
//
// This file must stay free of top-level imports/exports: an ambient module
// declaration for a package TypeScript doesn't already know about is only legal
// in a global (non-module) declaration file.
declare module "@fontsource-variable/*";
