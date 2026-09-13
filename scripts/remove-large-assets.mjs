/**
 * Post-build cleanup for Cloudflare Pages compatibility.
 *
 * Removes dist/libreoffice-wasm (soffice.wasm.gz ~46.5 MiB, soffice.data.gz
 * ~27.3 MiB). Cloudflare Pages rejects any file over 25 MiB, and the
 * Office-to-PDF tools that use this engine are disabled at build time
 * (see src/js/utils/disabled-tools.ts).
 */
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const targetDir = fileURLToPath(new URL('../dist/libreoffice-wasm', import.meta.url));

if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true });
  console.log('[remove-large-assets] removed dist/libreoffice-wasm');
} else {
  console.log('[remove-large-assets] dist/libreoffice-wasm not found (nothing to remove)');
}
