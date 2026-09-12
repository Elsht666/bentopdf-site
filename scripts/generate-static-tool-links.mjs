import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOOLS_CONFIG = path.resolve(__dirname, '../src/js/config/tools.ts');
const PAGES_DIR = path.resolve(__dirname, '../src/pages');
const PARTIAL_PATH = path.resolve(
  __dirname,
  '../src/partials/tool-links-static.html'
);

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function unescapeTs(value) {
  return value.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

function parseCategories(source) {
  const headers = [
    ...source.matchAll(/name:\s*'((?:[^'\\]|\\.)*)',\s*\n\s*tools:\s*\[/g),
  ].map((m) => ({ name: unescapeTs(m[1]), index: m.index }));

  const toolMatches = [
    ...source.matchAll(
      /\{[^{}]*?href:\s*import\.meta\.env\.BASE_URL\s*\+\s*'((?:[^'\\]|\\.)*)'[^{}]*?\}/gs
    ),
  ];
  const categories = headers.map((h) => ({ name: h.name, tools: [] }));
  for (const match of toolMatches) {
    const block = match[0];
    const hrefFile = unescapeTs(match[1]);
    const nameMatch = block.match(/name:\s*'((?:[^'\\]|\\.)*)'/s);
    const subtitleMatch = block.match(/subtitle:\s*\n?\s*'((?:[^'\\]|\\.)*)'/s);
    if (!nameMatch) continue;

    let categoryIndex = -1;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].index < match.index) categoryIndex = i;
    }
    if (categoryIndex === -1) continue;

    categories[categoryIndex].tools.push({
      slug: hrefFile.replace(/\.html$/, ''),
      name: unescapeTs(nameMatch[1]),
      subtitle: subtitleMatch ? unescapeTs(subtitleMatch[1]) : '',
    });
  }
  return categories.filter((c) => c.tools.length > 0);
}

function generate() {
  const source = fs.readFileSync(TOOLS_CONFIG, 'utf-8');
  const categories = parseCategories(source);
  const existingPages = new Set(
    fs
      .readdirSync(PAGES_DIR)
      .filter((f) => f.endsWith('.html'))
      .map((f) => f.replace(/\.html$/, ''))
  );

  const seen = new Set();
  const lines = [];
  let toolCount = 0;
  let inPopular = false;
  let inAllTools = false;
  for (const category of categories) {
    const tools = category.tools.filter(
      (t) => existingPages.has(t.slug) && !seen.has(t.slug)
    );
    if (tools.length === 0) continue;
    for (const t of tools) seen.add(t.slug);
    const isPopular = category.name === 'Popular Tools';
    if (isPopular && !inPopular) {
      lines.push(
        `<div class="col-span-full mt-10 rounded-2xl border-2 border-gray-400/70 p-4 md:p-6">`
      );
      inPopular = true;
    }
    if (!isPopular && !inAllTools) {
      lines.push(
        `<div class="col-span-full mt-10 rounded-2xl border-2 border-gray-400/70 p-4 md:p-6">` +
          `<div class="flex items-center gap-4 mb-4"><span class="text-xs font-semibold uppercase tracking-widest text-gray-500">All Tools</span><span class="flex-1 h-px bg-gray-700"></span></div>`
      );
      inAllTools = true;
    }
    lines.push(
      isPopular
        ? `<div class="mt-6"><h2 class="text-2xl md:text-3xl font-bold text-white">${escapeHtml(category.name)}</h2></div>`
        : `<div class="mt-6"><h2 class="inline-block rounded-md bg-gray-200 text-gray-900 text-sm font-semibold px-3 py-1.5">${escapeHtml(category.name)}</h2></div>`
    );
    if (!isPopular) {
      lines.push(
        `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">`
      );
    }
    for (const tool of tools) {
      toolCount++;
      lines.push(
        isPopular
          ? `<a href="/${tool.slug}" class="block bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-6 border border-indigo-500/30 hover:border-indigo-400 hover:shadow-xl transition-colors">` +
              `<h3 class="text-white text-lg font-bold mb-1">${escapeHtml(tool.name)}</h3>` +
              `<p class="text-gray-300 text-sm">${escapeHtml(tool.subtitle)}</p>` +
              `</a>`
          : `<a href="/${tool.slug}" class="block bg-gray-800/60 rounded-lg p-3 hover:bg-gray-700/60 transition-colors">` +
              `<h3 class="text-gray-200 text-sm font-medium mb-0.5">${escapeHtml(tool.name)}</h3>` +
              `<p class="text-gray-500 text-[11px]">${escapeHtml(tool.subtitle)}</p>` +
              `</a>`
      );
    }
    if (!isPopular) {
      lines.push(`</div>`);
    }
  }
  if (inPopular) lines.push(`</div>`);
  if (inAllTools) lines.push(`</div>`);

  if (toolCount < 50) {
    console.error(
      `generate-static-tool-links: only ${toolCount} tools parsed from tools.ts — parser is likely out of sync with the config format`
    );
    process.exit(1);
  }

  fs.writeFileSync(PARTIAL_PATH, lines.join('\n') + '\n');
  console.log(
    `Static tool links: ${toolCount} tools in ${categories.length} categories -> src/partials/tool-links-static.html`
  );
}

generate();
