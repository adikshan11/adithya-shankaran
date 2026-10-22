// The one Node API the tests use (reading a score from public/), declared here instead of adding @types/node.
declare module 'node:fs' {
  export function readFileSync(path: string): Uint8Array<ArrayBuffer>;
}
