// Copies the AI runtime's WebAssembly files from node_modules into public/ort/,
// so the site serves them itself instead of loading them from a public CDN.
// Runs automatically before `npm run dev` and `npm run build` (see package.json "predev"/"prebuild").
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const src = join('node_modules', 'onnxruntime-web', 'dist');
const dest = join('public', 'ort');
const files = [
  'ort-wasm-simd-threaded.asyncify.mjs',
  'ort-wasm-simd-threaded.asyncify.wasm',
  'ort-wasm-simd-threaded.mjs', // Safari
  'ort-wasm-simd-threaded.wasm',
];

if (!existsSync(src)) {
  console.warn('[copy-ort] onnxruntime-web is not installed, skipping (the AI runtime will load from a CDN instead).');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const f of files) cpSync(join(src, f), join(dest, f));
console.log(`[copy-ort] copied ${files.length} files to ${dest}`);
