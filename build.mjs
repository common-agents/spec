// Builds the static site into dist/.
// Markdown pages under spec/ are rendered into site/layout.html; HTML pages
// under site/ are wrapped in the same layout; schema/ and examples/ are copied.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { marked } from 'marked';
import { gfmHeadingId, getHeadingList } from 'marked-gfm-heading-id';

const SITE_URL = 'https://commonagents.io';
const REPO_URL = 'https://github.com/commonagents/spec';
const OUT = 'dist';

marked.use(gfmHeadingId());

const layout = readFileSync('site/layout.html', 'utf8');

// Splits a leading YAML frontmatter block into simple key/value pairs.
function splitFrontmatter(src) {
  const match = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { meta: {}, body: src };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([\w-]+):\s*"?(.*?)"?$/);
    if (kv) meta[kv[1]] = kv[2];
  }
  return { meta, body: src.slice(match[0].length) };
}

function render({ title, description, path, content, toc = '' }) {
  const vars = {
    fullTitle: path === 'index.html' ? title : `${title} · Common Agent Format`,
    description,
    canonical: `${SITE_URL}/${path === 'index.html' ? '' : path}`,
    content,
    toc,
    repo: REPO_URL,
    pageClass: toc ? 'page page--toc' : 'page',
  };
  let html = layout.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
  // Marks the current page's nav link.
  html = html.replace(`href="${path}"`, `href="${path}" aria-current="page"`);
  writeFileSync(`${OUT}/${path}`, html);
}

function renderMarkdown(file, path, description) {
  const { meta, body } = splitFrontmatter(readFileSync(file, 'utf8'));
  const content = marked.parse(body);
  const toc = getHeadingList()
    .filter((h) => h.level === 2 || h.level === 3)
    .map((h) => `<li class="toc-l${h.level}"><a href="#${h.id}">${h.text}</a></li>`)
    .join('\n');
  render({
    title: meta.title,
    description,
    path,
    content: `<article class="prose">${content}</article>`,
    toc: `<nav class="toc" aria-label="On this page"><p class="toc-title">On this page</p><ul>${toc}</ul></nav>`,
  });
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync('site/assets', `${OUT}/assets`, { recursive: true });
cpSync('schema', `${OUT}/schema`, { recursive: true });
cpSync('examples', `${OUT}/examples`, { recursive: true });
writeFileSync(`${OUT}/CNAME`, 'commonagents.io\n');

render({
  title: 'Common Agent Format',
  description: 'One agent definition, installed into any coding harness.',
  path: 'index.html',
  content: readFileSync('site/index.html', 'utf8').replace(/\{\{repo\}\}/g, REPO_URL),
});
renderMarkdown(
  'spec/SPECIFICATION.md',
  'specification.html',
  'The Common Agent Format specification: AGENT.md frontmatter, body and harness-specific configuration.',
);
renderMarkdown(
  'spec/HARNESSES.md',
  'harnesses.html',
  'Where each coding harness keeps custom agents, and how CAF fields map to each one.',
);

console.log(`Built ${OUT}/`);
