import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SOURCE = path.join(ROOT, 'workshops', 'agentic-copilot');
export const DIST = path.join(ROOT, 'dist', 'moaw');
export const PAGE_SEPARATOR = /(?:\n\n|\r\n\r\n)---(?:\n\n|\r\n\r\n)/;
export const readText = (file) => readFileSync(file, 'utf8');
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const portable = (file) => file.split(path.sep).join('/');

export function parseDocument(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  assert(match, 'metadata: YAML front matter is required');
  const meta = parse(match[1], { uniqueKeys: true });
  assert(meta && typeof meta === 'object' && !Array.isArray(meta), 'metadata: expected a mapping');
  return { meta, body: match[2].trim() };
}

export function validateMetadata(meta, { publish = false } = {}) {
  assert.equal(meta.type, 'workshop', 'metadata.type: expected workshop');
  for (const key of ['title', 'short_title', 'footer_title', 'author_name', 'author_affiliation', 'description', 'tags']) {
    assert(typeof meta[key] === 'string' && meta[key].trim(), `metadata.${key}: expected nonempty string`);
  }
  assert(typeof meta.workshop_version === 'string' && /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(meta.workshop_version),
    'metadata.workshop_version: expected a major.minor.patch string without a v prefix');
  assert(['beginner', 'intermediate', 'advanced'].includes(meta.level), 'metadata.level: invalid value');
  for (const key of ['authors', 'contacts']) {
    assert(Array.isArray(meta[key]) && meta[key].length > 0, `metadata.${key}: expected nonempty list`);
    assert(meta[key].every((value) => typeof value === 'string' && value.trim()), `metadata.${key}: invalid entry`);
  }
  assert.equal(meta.authors.length, meta.contacts.length, 'metadata: authors and contacts must align');
  assert(URL.canParse(meta.contacts[0]) && new URL(meta.contacts[0]).protocol === 'https:',
    'metadata.contacts: the author profile must be an HTTPS URL');
  assert.equal(typeof meta.published, 'boolean', 'metadata.published: expected boolean');
  if (meta.duration_minutes === undefined) {
    assert(!publish && meta.published === false, 'metadata.duration_minutes: required for publication');
    return ['duration_minutes is intentionally unset: workshop duration has not been agreed'];
  }
  assert(typeof meta.duration_minutes === 'number' && Number.isFinite(meta.duration_minutes)
    && meta.duration_minutes > 0, 'metadata.duration_minutes: expected a positive number');
  return [];
}

export function inspectFences(text, label = 'document') {
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  const visible = [];
  const codeBlocks = [];
  let fence = null;
  let code = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const token = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      assert(!(line === '---' && lines[i - 1] === '' && lines[i + 1] === ''),
        `${label}:${i + 1}: raw page separator inside fence`);
      if (token && token[1][0] === fence[0] && token[1].length >= fence.length && !token[2].trim()) {
        codeBlocks.push(code.join('\n'));
        fence = null;
        code = [];
      } else {
        code.push(line);
      }
      visible.push('');
    } else if (token) {
      fence = token[1];
      visible.push('');
    } else {
      visible.push(line);
    }
  }
  assert.equal(fence, null, `${label}: unmatched code fence`);
  return { visible: visible.join('\n'), codeBlocks };
}

export function inspectPages(body, label = 'document') {
  inspectFences(body, label);
  return body.split(PAGE_SEPARATOR).map((text, index) => {
    const { visible, codeBlocks } = inspectFences(text, `${label} page ${index + 1}`);
    const markers = [...visible.matchAll(/<!-- page: ([a-z0-9-]+) -->/g)];
    assert.equal(markers.length, 1, `${label} page ${index + 1}: expected one page marker`);
    const heading = visible.match(/^#{1,2} (.+)$/m);
    assert(heading, `${label} page ${index + 1}: missing page heading`);
    const detailTags = visible.match(/<\/?details\b[^>]*>/g) ?? [];
    let depth = 0;
    for (const tag of detailTags) {
      assert(!/\bopen(?:\s|=|>)/i.test(tag), `${label}: details must be closed by default`);
      depth += tag.startsWith('</') ? -1 : 1;
      assert(depth >= 0, `${label}: unmatched details closing tag`);
    }
    assert.equal(depth, 0, `${label}: unmatched details`);
    assert(!/<(?:script|iframe|object|embed|link|style)\b|\bon[a-z]+\s*=/i.test(visible),
      `${label}: active HTML or event handler is not allowed`);
    assert(!/(?<!\\)\$\$/.test(text), `${label}: unexpected MOAW variable or math expansion`);
    for (const block of codeBlocks) {
      assert(!/(?<!\\)assets\//.test(block), `${label}: asset rewriting would change a code example`);
    }
    return { id: markers[0][1], title: heading[1], text, visible, codeBlocks };
  });
}

export function exactFile(base, relative, label = 'file') {
  assert(relative && !path.isAbsolute(relative) && !relative.includes('\\'), `${label}: invalid relative URL`);
  let current = base;
  for (const segment of relative.split('/')) {
    assert(segment && segment !== '.' && segment !== '..', `${label}: path traversal is not allowed`);
    assert(existsSync(current) && readdirSync(current).includes(segment), `${label}: missing or wrong case: ${relative}`);
    current = path.join(current, segment);
  }
  return current;
}

export function validateAssets(pages, source = SOURCE) {
  const assets = new Set();
  for (const page of pages) {
    for (const match of page.visible.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)) {
      assert(match[1].trim().length > 5, `asset: meaningful alternative text required on ${page.id}`);
      assert(/^assets\/[a-z0-9-]+\.svg$/.test(match[2]), `asset: expected a local SVG on ${page.id}`);
      const file = exactFile(source, match[2], 'asset');
      const svg = readText(file);
      assert(/<svg\b/.test(svg) && /\bviewBox=/.test(svg), `asset: SVG viewBox required: ${file}`);
      assert(/<title\b/.test(svg) && /<desc\b/.test(svg) && /aria-labelledby=/.test(svg),
        `asset: SVG accessibility metadata required: ${file}`);
      assert(!/<(?:script|foreignObject|image|iframe)\b|\bon[a-z]+\s*=|(?:href|src)\s*=\s*["'](?!#)|@import|url\(\s*["']?(?!#)/i.test(svg),
        `asset: active or external SVG content: ${file}`);
      assets.add(file);
    }
  }
  return [...assets];
}

export function loadWorkshop({ publish = false } = {}) {
  const entry = path.join(SOURCE, 'workshop.md');
  const { meta, body } = parseDocument(readText(entry));
  const pending = validateMetadata(meta, { publish });
  const matches = [...body.matchAll(/^include::(chapters\/[a-z0-9-]+\.md)\[\]$/gm)];
  const remainder = body.replace(/^include::chapters\/[a-z0-9-]+\.md\[\]$/gm, '').replace(PAGE_SEPARATOR, '');
  assert(/^[\s-]*$/.test(remainder), 'entry: only chapter includes and separators are supported');
  assert.equal(matches.length, 10, 'entry: introduction, eight chapters, and reference are required');
  const chapters = matches.map((match, index) => {
    assert(path.basename(match[1]).startsWith(`${String(index).padStart(2, '0')}-`), 'entry: chapter order mismatch');
    const file = exactFile(SOURCE, match[1], 'include');
    const text = readText(file).trim();
    assert(!text.includes('include::'), `include: nested includes are not expected in ${match[1]}`);
    return { file, text, pages: inspectPages(text, match[1]) };
  });
  const pages = chapters.flatMap((chapter) => chapter.pages);
  assert.equal(new Set(pages.map((page) => page.id)).size, pages.length, 'pages: duplicate page ID');
  const assets = validateAssets(pages);
  const files = [entry, ...chapters.map((chapter) => chapter.file), ...assets];
  const sourceHashes = Object.fromEntries(files.map((file) => [portable(path.relative(ROOT, file)), sha256(readFileSync(file))]));
  const acRows = readText(path.join(ROOT, 'docs', 'design', 'common-scenario.md'))
    .split(/\r?\n/).filter((line) => /^\| AC-\d{2} \|/.test(line));
  assert.equal(acRows.length, 11, 'AC source: expected eleven canonical rows');
  for (const row of acRows) {
    assert(chapters[0].text.split(/\r?\n/).includes(row), `AC source: changed or missing row ${row.split('|')[1].trim()}`);
  }
  if (meta.sections_title !== undefined) {
    assert.deepEqual(meta.sections_title, pages.map((page) => page.title), 'metadata.sections_title: page labels must match');
  }
  return { meta, pending, chapters, pages, assets, sourceHashes };
}

export function checkLocalLinks() {
  const files = [path.join(ROOT, 'README.md'), path.join(ROOT, 'THIRD-PARTY-NOTICES.md')];
  function collect(directory) {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name);
      if (item.isDirectory()) collect(file);
      else if (item.name.endsWith('.md')) files.push(file);
    }
  }
  collect(path.join(ROOT, 'docs'));
  collect(path.join(ROOT, 'authoring'));
  let count = 0;
  for (const file of files) {
    // The upstream skill deliberately teaches a separator inside a fence.
    const text = readText(file).replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n {0,3}\1[ \t]*(?=\r?\n|$)/gm, '');
    for (const match of text.matchAll(/!?\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
      const href = match[1];
      if (/^(?:https?:|mailto:|#)/.test(href)) continue;
      const target = path.resolve(path.dirname(file), decodeURIComponent(href.split(/[?#]/)[0]));
      const relative = portable(path.relative(ROOT, target));
      exactFile(ROOT, relative, 'link');
      count += 1;
    }
  }
  return count;
}
