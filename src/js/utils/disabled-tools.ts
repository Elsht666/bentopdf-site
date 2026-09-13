import type { AppConfig } from '@/types';

const RENAMED_TOOL_IDS: Record<string, string> = {
  'decrypt-pdf': 'unlock-pdf',
  'encrypt-pdf': 'protect-pdf',
  'pdf-to-docx': 'pdf-to-word',
};

function normalizeToolId(toolId: string): string {
  return RENAMED_TOOL_IDS[toolId] ?? toolId;
}

// Office-to-PDF conversions rely on the LibreOffice WASM engine
// (dist/libreoffice-wasm, >25 MiB per file), which exceeds the
// Cloudflare Pages per-file limit. Disabled for Cloudflare Pages hosting.
const OFFICE_CONVERT_TOOL_IDS = [
  'word-to-pdf',
  'excel-to-pdf',
  'powerpoint-to-pdf',
  'wps-to-pdf',
  'odt-to-pdf',
  'ods-to-pdf',
  'odp-to-pdf',
  'odg-to-pdf',
  'pages-to-pdf',
  'pub-to-pdf',
  'rtf-to-pdf',
  'vsd-to-pdf',
  'wpd-to-pdf',
];

// Specialist / niche tools that average users rarely need.
// Disabled to keep the tool grid focused on everyday PDF tasks.
const UNCOMMON_TOOL_IDS = [
  // print & prepress
  'n-up-pdf',
  'pdf-booklet',
  'posterize-pdf',
  'combine-single-page',
  'divide-pages',
  'duplex-collate',
  'rotate-custom',
  'linearize-pdf',
  'font-to-outline',
  'pdf-to-pdfa',
  'fix-page-size',
  'page-dimensions',
  // legal / archival
  'bates-numbering',
  'add-page-labels',
  'timestamp-pdf',
  'validate-signature-pdf',
  // document structure
  'pdf-layers',
  'bookmark',
  'table-of-contents',
  // developer / data
  'pdf-to-json',
  'pdf-to-csv',
  'extract-tables',
  'prepare-pdf-for-ai',
  'json-to-pdf',
  'xml-to-pdf',
  // rare formats
  'mobi-to-pdf',
  'fb2-to-pdf',
  'cbz-to-pdf',
  'pdf-to-cbz',
  'psd-to-pdf',
  'email-to-pdf',
  'bmp-to-pdf',
  'svg-to-pdf',
  // attachments / metadata
  'add-attachments',
  'extract-attachments',
  'edit-attachments',
  'view-metadata',
  'edit-metadata',
  // color / visual effects
  'invert-colors',
  'scanner-effect',
  'adjust-colors',
  'background-color',
  'text-color',
  // professional processing
  'rasterize-pdf',
  'deskew-pdf',
  'sanitize-pdf',
  'flatten-pdf',
  'compare-pdfs',
  // misc
  'pdf-to-greyscale',
  'csv-to-pdf',
];

const disabledToolsSet = new Set<string>([
  ...__DISABLED_TOOLS__.map(normalizeToolId),
  ...OFFICE_CONVERT_TOOL_IDS.map(normalizeToolId),
  ...UNCOMMON_TOOL_IDS.map(normalizeToolId),
]);
let runtimeConfigLoaded = false;
let editorDisabledCategories: string[] = [];

export async function loadRuntimeConfig(): Promise<void> {
  if (runtimeConfigLoaded) return;
  runtimeConfigLoaded = true;

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}config.json`, {
      cache: 'no-cache',
    });
    if (!response.ok) return;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return;
    }

    const config: AppConfig = await response.json();
    if (Array.isArray(config.disabledTools)) {
      for (const toolId of config.disabledTools) {
        if (typeof toolId === 'string') {
          disabledToolsSet.add(normalizeToolId(toolId));
        }
      }
    }
    if (Array.isArray(config.editorDisabledCategories)) {
      editorDisabledCategories = config.editorDisabledCategories.filter(
        (c): c is string => typeof c === 'string'
      );
    }
  } catch (err) {
    console.warn('[LOAD_RUNTIME_CONFIG] Skipped runtime config:', err);
  }
}

export function isToolDisabled(toolId: string): boolean {
  return disabledToolsSet.has(toolId);
}

export function getToolIdFromPath(): string | null {
  const path = window.location.pathname;
  const withExt = path.match(/\/([^/]+)\.html$/);
  if (withExt) return withExt[1];
  const withoutExt = path.match(/\/([^/]+)\/?$/);
  return withoutExt?.[1] ?? null;
}

export function getEditorDisabledCategories(): string[] {
  return editorDisabledCategories;
}

export function isCurrentPageDisabled(): boolean {
  const toolId = getToolIdFromPath();
  if (!toolId) return false;
  return isToolDisabled(toolId);
}
