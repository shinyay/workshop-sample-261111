// Shell adaptation follows the MIT-licensed MOAW Copilot Kit; see THIRD-PARTY-NOTICES.md.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { DIST, ROOT, SOURCE, inspectPages, loadWorkshop, parseDocument, portable, sha256 } from './content.mjs';

export function replaceOnce(text, pattern, replacement, label) {
  assert.equal([...text.matchAll(new RegExp(pattern.source, 'g'))].length, 1, `upstream shell contract changed: ${label}`);
  return text.replace(pattern, () => replacement);
}

export function presentationSettings(meta) {
  return {
    title: meta.short_title,
    footerTitle: meta.footer_title,
    version: meta.workshop_version,
    account: meta.authors[0],
    profileUrl: meta.contacts[0],
    authorName: meta.author_name,
    authorAffiliation: meta.author_affiliation
  };
}

export function adaptShell(html, settings) {
  html = replaceOnce(html, /<script>\s*if \(window\.location\.hostname\.includes\('\.github\.io'\)\) \{\s*window\.document\.head\.getElementsByTagName\('base'\)\[0\]\.href = '\/moaw\/';\s*}\s*<\/script>/, '', 'github.io base override');
  html = replaceOnce(html, /<script type="text\/javascript">\s*\(function\(c,l,a,r,i,t,y\)\{[\s\S]*?https:\/\/www\.clarity\.ms\/tag\/[\s\S]*?"e9irosy2ud"\);\s*<\/script>/, '', 'Clarity');
  html = replaceOnce(html, /<html lang="en"/, '<html lang="ja"', 'document language');
  const title = settings.title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  html = replaceOnce(html, /<title>MOAW<\/title>/, `<title>${title}</title>`, 'title');
  const config = JSON.stringify(settings).replaceAll('<', '\\u003c');
  html = replaceOnce(html, /<\/head>/, [
    '<link rel="stylesheet" href="workshop-presentation.css">',
    `<script id="workshop-presentation-settings" type="application/json">${config}</script>`,
    '<script type="module" src="workshop-presentation.js"></script>',
    '</head>'
  ].join('\n'), 'presentation assets');
  assert(!html.includes('clarity.ms') && !html.includes("href = '/moaw/'"), 'unsafe upstream shell remains');
  return html;
}

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), `build: unexpected symbolic link: ${file}`);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

export function buildWorkshop() {
  const workshop = loadWorkshop();
  const cli = path.join(ROOT, 'node_modules', '@moaw', 'cli');
  assert.equal(JSON.parse(readFileSync(path.join(cli, 'package.json'), 'utf8')).version, '1.6.1', 'MOAW CLI version changed');
  const viewer = path.join(cli, 'dist', 'website');
  const shell = adaptShell(readFileSync(path.join(viewer, 'index.html'), 'utf8'), presentationSettings(workshop.meta));
  mkdirSync(path.join(DIST, 'workshops', 'assets'), { recursive: true });
  const combined = path.join(DIST, 'workshops', 'workshop.md');
  const result = spawnSync(process.execPath, [path.join(cli, 'bin', 'moaw.js'), 'build', path.join(SOURCE, 'workshop.md'), '--dest', combined], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, NO_UPDATE_NOTIFIER: '1', XDG_CONFIG_HOME: path.join(ROOT, '.cache', 'config') }
  });
  assert(Number.isInteger(result.status), `MOAW CLI did not finish: ${result.error?.message ?? result.signal}`);
  assert.equal(result.status, 0, `MOAW build failed: ${result.stderr}\n${result.stdout}`);
  const assembled = parseDocument(readFileSync(combined, 'utf8'));
  const body = assembled.body.replaceAll('\r\n', '\n');
  const pages = inspectPages(body, 'official CLI output');
  assert.deepEqual(pages.map((page) => page.id), workshop.pages.map((page) => page.id), 'official CLI page order mismatch');
  assert.deepEqual(pages.map((page) => page.codeBlocks), workshop.pages.map((page) => page.codeBlocks), 'official CLI changed code examples');
  writeFileSync(combined, `---\n${stringify({ ...workshop.meta, sections_title: pages.map((page) => page.title) })}---\n\n${body}\n`);
  const servedFiles = ['workshops/workshop.md'];
  const upstream = {};
  for (const file of filesIn(viewer)) {
    const relative = portable(path.relative(viewer, file));
    const target = path.join(DIST, ...relative.split('/'));
    mkdirSync(path.dirname(target), { recursive: true });
    if (relative === 'index.html') writeFileSync(target, shell);
    else copyFileSync(file, target);
    servedFiles.push(relative);
    if (/\.(?:js|css)$/.test(relative)) {
      upstream[relative] = sha256(readFileSync(file));
      assert.equal(sha256(readFileSync(target)), upstream[relative], `viewer bundle changed: ${relative}`);
    }
  }
  assert(Object.keys(upstream).some((file) => readFileSync(path.join(viewer, file), 'utf8').includes('sha.9deeac0')), 'unexpected viewer build');
  const presentation = {};
  for (const name of ['workshop-presentation.js', 'workshop-presentation.css']) {
    const source = path.join(ROOT, 'scripts', 'viewer', name);
    copyFileSync(source, path.join(DIST, name));
    servedFiles.push(name);
    presentation[name] = sha256(readFileSync(source));
  }
  for (const asset of workshop.assets) {
    const relative = `workshops/assets/${path.basename(asset)}`;
    copyFileSync(asset, path.join(DIST, ...relative.split('/')));
    servedFiles.push(relative);
  }
  for (const name of ['MOAW-MIT.txt', 'MOAW-Copilot-Kit-MIT.txt']) {
    copyFileSync(path.join(ROOT, 'authoring', name), path.join(DIST, name));
    servedFiles.push(name);
  }
  const info = {
    repository: 'shinyay/github-copilot-agentic-workshop-with-token-economy',
    kitRevision: 'a1bad8fe077d768c7ab860ad5ddfd9a766064c57',
    moawCli: '1.6.1',
    viewerBuild: 'sha.9deeac0',
    workshopVersion: workshop.meta.workshop_version,
    contentSha256: sha256(readFileSync(combined)),
    sourceHashes: workshop.sourceHashes,
    upstream,
    presentation,
    pages: pages.map(({ id, title }) => ({ id, title })),
    pending: workshop.pending,
    files: [...new Set([...servedFiles, 'build-info.json'])].sort()
  };
  writeFileSync(path.join(DIST, 'build-info.json'), `${JSON.stringify(info, null, 2)}\n`);
  console.log(`Built ${pages.length} pages and ${workshop.assets.length} SVGs with official MOAW ${info.viewerBuild}.`);
  for (const pending of workshop.pending) console.log(`DRAFT PENDING: ${pending}`);
  return info;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    buildWorkshop();
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
