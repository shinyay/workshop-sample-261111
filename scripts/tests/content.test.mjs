import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { adaptShell, presentationSettings } from '../build.mjs';
import {
  ROOT, SOURCE, exactFile, inspectFences, inspectPages, loadWorkshop,
  parseDocument, validateAssets, validateMetadata
} from '../content.mjs';

const validMeta = {
  type: 'workshop', title: 'Draft', description: 'Learning draft', level: 'intermediate',
  short_title: 'Workshop', footer_title: 'Workshop footer', workshop_version: '1.0.0',
  author_name: 'Author Name', author_affiliation: 'Author Organization',
  tags: 'moaw, test', authors: ['Author'], contacts: ['https://example.org'], published: false
};

test('the complete manuscript covers all eight chapters with independent page IDs', () => {
  const workshop = loadWorkshop();
  assert.equal(workshop.chapters.length, 10);
  for (let number = 1; number <= 8; number += 1) {
    const pages = workshop.chapters[number].pages;
    assert(pages.length > 1);
    assert(pages.every(({ id }) => id.startsWith(`sec${String(number).padStart(2, '0')}-`)));
  }
  assert.equal(workshop.assets.length, 10);
  assert.equal(workshop.pending.length, 1);
  assert.equal(workshop.meta.duration_minutes, undefined);
});

test('chapter-section numbers match the chapter map while chapter references and SVGs stay consistent', () => {
  const { chapters, pages, assets } = loadWorkshop();
  const labels = Array.from({ length: 8 }, (_, index) => `\u7b2c${index + 1}\u7ae0`);
  for (let number = 1; number <= 8; number += 1) {
    for (const [index, page] of chapters[number].pages.entries()) {
      const section = `${number}-${index + 1}`;
      assert(page.title.startsWith(`${section}\uff5c`), `${page.id}: expected a ${section} heading`);
    }
  }
  for (const chapter of [chapters[0], chapters.at(-1)]) {
    for (const page of chapter.pages) {
      assert(!/^(?:\d+-\d+|\u7b2c\d+\u7ae0)\uff5c/.test(page.title), `${page.id}: keep introduction and reference unnumbered`);
    }
  }
  for (const page of pages) {
    assert(!/\bSEC-\d{2}\b/.test(page.visible), `${page.id}: use Japanese chapter references`);
  }
  const journey = chapters[0].pages.find(({ id }) => id === 'journey');
  const mapRows = [...journey.visible.matchAll(/^\| (\u7b2c[1-8]\u7ae0)<br><span\b[^>]*>([^<]+)<\/span> \|/gm)]
    .map((match) => [match[1], match[2].trim()]);
  assert.deepEqual(mapRows, labels.map((label, index) => [
    label, `${index + 1}-1\u301c${index + 1}-${chapters[index + 1].pages.length}`
  ]));
  for (const asset of assets) {
    assert(!/\bSEC-\d{2}\b/.test(readFileSync(asset, 'utf8')), `${path.basename(asset)}: use Japanese chapter references`);
  }
  const diagram = readFileSync(path.join(SOURCE, 'assets', 'journey.svg'), 'utf8');
  for (let index = 0; index < labels.length; index += 2) {
    assert(diagram.includes(`${labels[index]}\u30fb${labels[index + 1]}`), `journey.svg: missing chapter pair ${index + 1}`);
  }
});

test('the introduction explains learning goals and the scenario before the main chapters', () => {
  const { chapters } = loadWorkshop();
  const introduction = chapters[0];
  assert.equal(introduction.pages[0].title, '\u306f\u3058\u3081\u306b');
  const ids = introduction.pages.map(({ id }) => id);
  assert(ids.indexOf('learning-goals') > 0, 'learning goals must follow the introduction opening');
  assert(ids.indexOf('scenario-overview') > ids.indexOf('learning-goals'), 'the scenario must follow learning goals');
  assert(ids.indexOf('journey') > ids.indexOf('scenario-overview'), 'the chapter map must follow the scenario');
  const goals = introduction.pages.find(({ id }) => id === 'learning-goals');
  assert.match(goals.visible, /\u8eab\u306b\u4ed8\u3051\u308b\u529b/);
  assert.match(goals.visible, /\u6210\u679c\u30fb\u78ba\u8a8d\u306e\u4f8b/);
  for (let number = 1; number <= 8; number += 1) {
    assert(goals.visible.includes(`\u7b2c${number}\u7ae0`), `learning goals must cover chapter ${number}`);
  }
  const scenario = introduction.pages.find(({ id }) => id === 'scenario-overview');
  assert.match(scenario.text, /GET \/api\/requests\?department=engineering&status=pending/);
  assert.equal(chapters[1].pages[0].id, 'sec01-observe');
});

test('learner pages provide goals, exercises and checks without authoring-status commentary', () => {
  const { chapters, pages, meta } = loadWorkshop();
  for (const chapter of chapters.slice(1, 9)) {
    for (const page of chapter.pages) {
      assert.match(page.visible, /^\*\*\u3053\u306e\u7bc0\u306e\u30b4\u30fc\u30eb:\*\* .+/m, `${page.id}: learning goal`);
      assert.match(page.visible, /^### \u6f14\u7fd2$/m, `${page.id}: exercise`);
      assert.match(page.visible, /^### \u7d50\u679c\u3092\u78ba\u304b\u3081\u308b$/m, `${page.id}: observable check`);
      assert.match(page.visible, /<details>/, `${page.id}: recovery hint or explanation`);
    }
  }
  const authoringLanguage = /\u521d\u7a3f|\u5168\u4f53\u30c9\u30e9\u30d5\u30c8|\u6559\u6750\u6e96\u5099\u5f8c|\u6e96\u5099\u5f85\u3061|MOAW\u5236\u4f5c|\bS[0-6]\b/;
  for (const page of pages) {
    assert(!authoringLanguage.test(page.text), `${page.id}: move authoring status and internal state IDs out of learner pages`);
  }
  assert(!/DRAFT|\u30c9\u30e9\u30d5\u30c8/.test(`${meta.title}\n${meta.short_title}`), 'use a learner-facing workshop title');
  const prerequisites = pages.find(({ id }) => id === 'prerequisites');
  assert.match(prerequisites.text, /\u540c\u68b1\u3055\u308c\u3066\u3044\u307e\u305b\u3093/, 'disclose unavailable exercise assets before practice');
  const preparation = readFileSync(path.join(ROOT, 'docs', 'design', 'workshop-preparation.md'), 'utf8');
  for (const comparison of ['A/B/C', 'R0/R1', 'V0/V1', 'AC-08']) {
    assert(preparation.includes(comparison), `preparation guide: ${comparison}`);
  }
});

test('duration is a reported draft exception, not a publication pass or an invalid value', () => {
  assert.equal(validateMetadata(validMeta).length, 1);
  assert.throws(() => validateMetadata(validMeta, { publish: true }), /duration_minutes: required/);
  for (const duration_minutes of [0, -1, 'TBD', '60', NaN, Infinity]) {
    assert.throws(() => validateMetadata({ ...validMeta, duration_minutes }), /duration_minutes: expected a positive number/);
  }
  assert.deepEqual(validateMetadata({ ...validMeta, duration_minutes: 60 }), []);
});

test('invalid metadata is rejected for its actual field', () => {
  for (const [patch, reason] of [
    [{ title: '' }, /metadata.title/],
    [{ type: 'page' }, /metadata.type/],
    [{ tags: ['moaw'] }, /metadata.tags/],
    [{ published: 'false' }, /metadata.published/],
    [{ authors: [] }, /metadata.authors/],
    [{ contacts: ['a', 'b'] }, /authors and contacts/]
  ]) {
    assert.throws(() => validateMetadata({ ...validMeta, ...patch }), reason);
  }
  assert.throws(() => parseDocument('---\ntitle: first\ntitle: second\n---\nBody'), /unique/i);
});

test('presentation metadata is required even while duration remains unset', () => {
  for (const key of ['short_title', 'footer_title', 'author_name', 'author_affiliation']) {
    for (const value of [undefined, '', '  ', 1, []]) {
      assert.throws(() => validateMetadata({ ...validMeta, [key]: value }), new RegExp(`metadata\\.${key}:`));
    }
  }
  for (const workshop_version of [undefined, '', 1, 'v1.0.0', '01.0.0', '1.0', '1.0.0\n', '1.0.0<script>']) {
    assert.throws(() => validateMetadata({ ...validMeta, workshop_version }), /metadata.workshop_version/);
  }
  for (const contact of ['javascript:alert(1)', 'http://example.org', 'not a URL']) {
    assert.throws(() => validateMetadata({ ...validMeta, contacts: [contact] }), /metadata.contacts/);
  }
  assert.equal(validateMetadata({ ...validMeta, workshop_version: '2.10.3' }).length, 1);
  assert.deepEqual(presentationSettings(validMeta), {
    title: 'Workshop', footerTitle: 'Workshop footer', version: '1.0.0',
    account: 'Author', profileUrl: 'https://example.org',
    authorName: 'Author Name', authorAffiliation: 'Author Organization'
  });
});

test('fenced YAML front matter is preserved, but a raw fenced separator is rejected', () => {
  const good = '<!-- page: example -->\n## Example\n\n```markdown\n---\napplyTo: "tests/**/*.py"\n---\nA rule.\n```';
  assert.equal(inspectPages(good)[0].codeBlocks[0], '---\napplyTo: "tests/**/*.py"\n---\nA rule.');
  const bad = good.replace('A rule.', 'before\n\n---\n\nafter');
  assert.equal((bad.match(/\n\n---\n\n/g) ?? []).length, 1);
  assert.throws(() => inspectPages(bad), /raw page separator inside fence/);
  assert.throws(() => inspectFences('```text\nunfinished'), /unmatched code fence/);
});

test('page identity and closed, balanced hints are required', () => {
  const base = '<!-- page: one -->\n## One\n\n<details>\n<summary>Hint</summary>\n\nText.\n\n</details>';
  assert.equal(inspectPages(base)[0].id, 'one');
  assert.throws(() => inspectPages(base.replace('<details>', '<details open>')), /closed by default/);
  assert.throws(() => inspectPages(base.replace('</details>', '')), /unmatched details/);
  assert.throws(() => inspectPages(base.replace('<!-- page: one -->', '')), /expected one page marker/);
  assert.throws(() => inspectPages(base.replace('## One', 'One')), /missing page heading/);
});

test('missing and wrong-case assets fail, without substituting another figure', () => {
  const page = inspectPages('<!-- page: asset -->\n## Asset\n\n![A useful description](assets/not-present.svg)');
  assert.throws(() => validateAssets(page), /asset: missing or wrong case/);
  assert.throws(() => exactFile(SOURCE, 'assets/Journey.svg', 'asset'), /missing or wrong case/);
  assert.throws(() => exactFile(SOURCE, '../README.md', 'asset'), /path traversal/);
});

test('unexpected active content and MOAW preprocessing inside copyable examples fail', () => {
  const page = '<!-- page: one -->\n## One\n\n';
  assert.throws(() => inspectPages(`${page}<script>alert(1)</script>`), /active HTML/);
  assert.throws(() => inspectPages(`${page}\`\`\`text\nassets/image.svg\n\`\`\``), /asset rewriting/);
  assert.throws(() => inspectPages(`${page}$$unexpected$$`), /unexpected MOAW variable/);
});

test('shell adaptation removes only the expected tracking and detects upstream drift', () => {
  const original = readFileSync(path.join(ROOT, 'node_modules', '@moaw', 'cli', 'dist', 'website', 'index.html'), 'utf8');
  const settings = presentationSettings(validMeta);
  const clean = adaptShell(original, settings);
  assert(!clean.includes('clarity.ms'));
  assert(!clean.includes("href = '/moaw/'"));
  assert(clean.includes('<html lang="ja"'));
  assert.equal((clean.match(/<base href="\/">/g) ?? []).length, 1);
  assert(clean.includes('<title>Workshop</title>'));
  assert.equal((clean.match(/src="workshop-presentation.js"/g) ?? []).length, 1);
  assert.equal((clean.match(/href="workshop-presentation.css"/g) ?? []).length, 1);
  assert.throws(() => adaptShell(original.replace('e9irosy2ud', 'changed-tag'), settings), /contract changed: Clarity/);
  const script = original.match(/<script type="text\/javascript">[\s\S]*?<\/script>/)[0];
  assert.throws(() => adaptShell(original.replace('</head>', `${script}</head>`), settings), /contract changed: Clarity/);
  assert.throws(() => adaptShell(original.replace('</head>', ''), settings), /contract changed: presentation assets/);
});

test('presentation settings survive HTML delimiters and replacement-string tokens as plain data', () => {
  const original = readFileSync(path.join(ROOT, 'node_modules', '@moaw', 'cli', 'dist', 'website', 'index.html'), 'utf8');
  const settings = {
    ...presentationSettings(validMeta),
    title: 'A & B <title> $&',
    authorName: '</script><img src=x onerror=alert(1)> $& $$',
    authorAffiliation: 'Text \u2028 separator \u2029 end'
  };
  const clean = adaptShell(original, settings);
  assert(clean.includes('<title>A &amp; B &lt;title&gt; $&amp;</title>'));
  assert(!clean.includes('<img src=x'));
  const encoded = clean.match(/<script id="workshop-presentation-settings" type="application\/json">([^<]+)<\/script>/)[1];
  assert.deepEqual(JSON.parse(encoded), settings);
});

test('publication check actually runs and rejects the real unset duration', () => {
  const run = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'check.mjs'), '--publish'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(run.error, undefined);
  assert(Number.isInteger(run.status), 'check process must actually finish');
  assert.equal(run.status, 1);
  assert.match(run.stderr, /metadata.duration_minutes: required for publication/);
});
