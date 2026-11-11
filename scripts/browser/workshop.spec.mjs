import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createPreviewServer } from '../serve.mjs';
import { DIST, ROOT, loadWorkshop, sha256 } from '../content.mjs';

const workshop = loadWorkshop();
const footerText = `${workshop.meta.footer_title} (v${workshop.meta.workshop_version})`;
let server;
let base;
test.beforeAll(async () => {
  const info = JSON.parse(readFileSync(path.join(DIST, 'build-info.json'), 'utf8'));
  expect(info.sourceHashes).toEqual(workshop.sourceHashes);
  expect(info.workshopVersion).toBe(workshop.meta.workshop_version);
  for (const [file, hash] of Object.entries(info.presentation)) {
    expect(sha256(readFileSync(path.join(ROOT, 'scripts', 'viewer', file)))).toBe(hash);
    expect(sha256(readFileSync(path.join(DIST, file)))).toBe(hash);
  }
  expect(info.contentSha256).toBe(sha256(readFileSync(path.join(DIST, 'workshops', 'workshop.md'))));
  server = createPreviewServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

async function observe(page, context) {
  const external = [];
  const errors = [];
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin !== base) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return { external, errors };
}

async function expectWorkshopFooter(page, text = footerText) {
  await expect(page.locator('app-footer footer')).toHaveText(text);
  await expect(page.locator('app-footer a')).toHaveCount(0);
  await expect(page.locator('app-footer svg.octicon-mark-github')).toHaveCount(1);
}

test('workshop identity replaces generated authors and the footer across navigation and reload', async ({ page, context }) => {
  const observed = await observe(page, context);
  await page.goto(`${base}/workshop/workshop.md`);
  const author = page.locator('[data-workshop-author]');
  const profile = author.getByRole('link', { name: `GitHub \u30a2\u30ab\u30a6\u30f3\u30c8: ${workshop.meta.authors[0]}` });
  await expect(author).toHaveCount(1);
  await expect(profile).toHaveAttribute('href', workshop.meta.contacts[0]);
  await expect(profile).toHaveText(workshop.meta.authors[0]);
  await expect(profile.locator('svg.octicon-mark-github')).toBeVisible();
  await expect(author.locator('.workshop-author-name')).toHaveText(workshop.meta.author_name);
  await expect(author.locator('.workshop-author-affiliation')).toHaveText(workshop.meta.author_affiliation);
  expect(await page.locator('markdown h1').evaluate((heading) => getComputedStyle(heading, '::after').content)).toBe('none');
  await expect(page.locator('app-header .title')).toHaveText(workshop.meta.short_title);
  await expect(page).toHaveTitle(`${workshop.meta.short_title} - ${workshop.pages[0].title}`);
  await expectWorkshopFooter(page);
  // MOAW only restores the first page from history when the URL explicitly has step=0.
  await page.locator('a[href$="?step=0"]').click();
  await expect(page).toHaveURL(/\?step=0$/);
  await page.locator('a[href$="?step=1"]').click();
  await expect(author).toHaveCount(0);
  await expectWorkshopFooter(page);
  await page.goBack();
  await expect(author).toHaveCount(1);
  await page.reload();
  await expect(author).toHaveCount(1);
  await expectWorkshopFooter(page);
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
});

test('presentation uses the supplied author and version as text, not executable markup', async ({ page, context }) => {
  const observed = await observe(page, context);
  await page.route('**/workshop/workshop.md', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script id="workshop-presentation-settings" type="application\/json">)([^<]+)(<\/script>)/,
      (_, open, json, close) => {
        const settings = { ...JSON.parse(json), version: '2.10.3', authorName: '<strong>Example $&</strong>', authorAffiliation: 'Team & Company' };
        return `${open}${JSON.stringify(settings).replaceAll('<', '\\u003c')}${close}`;
      }
    );
    await route.fulfill({ response, body });
  });
  await page.goto(`${base}/workshop/workshop.md`);
  await expect(page.locator('.workshop-author-name')).toHaveText('<strong>Example $&</strong>');
  await expect(page.locator('.workshop-author-name strong')).toHaveCount(0);
  await expect(page.locator('.workshop-author-affiliation')).toHaveText('Team & Company');
  await expectWorkshopFooter(page, `${workshop.meta.footer_title} (v2.10.3)`);
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
});

test('an incompatible viewer structure reports an explicit presentation failure', async ({ page, context }) => {
  const observed = await observe(page, context);
  await page.goto(`${base}/workshop/workshop.md`);
  await expectWorkshopFooter(page);
  await page.locator('app-footer app-icon[name="mark-github"]').evaluate((icon) => icon.remove());
  await expect(page.locator('app-footer app-icon[name="mark-github"]')).toHaveCount(0);
  await expect(page.locator('.workshop-presentation-error[role="alert"]')).toHaveCount(1);
  expect(observed.errors).toHaveLength(1);
  expect(observed.errors[0]).toContain('Workshop presentation failed:');
  expect(observed.errors[0]).toContain('Missing viewer element: app-icon[name="mark-github"]');
  expect(observed.external).toEqual([]);
});

test('presentation text and the navigation fit desktop and narrow screens without clipping or overlap', async ({ page, context }) => {
  const observed = await observe(page, context);
  for (const width of [1280, 320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${base}/workshop/workshop.md`);
    await expect(page.locator('[data-workshop-author]')).toBeVisible();
    await expectWorkshopFooter(page);
    const layout = await page.evaluate(() => {
      const box = (selector) => document.querySelector(selector).getBoundingClientRect().toJSON();
      const title = document.querySelector('app-header .title');
      const fragments = ['app-header .title', '.workshop-author-affiliation', '.workshop-footer-label'].flatMap((selector) => {
        const range = document.createRange();
        range.selectNodeContents(document.querySelector(selector));
        return [...range.getClientRects()].map((rect) => rect.toJSON());
      });
      return {
        header: box('app-header .navbar'), title: box('app-header .title'),
        heading: box('markdown h1'), account: box('.workshop-author-account'),
        name: box('.workshop-author-name'), affiliation: box('.workshop-author-affiliation'),
        fragments,
        titleClipped: title.scrollWidth > title.clientWidth + 1,
        overflow: document.documentElement.scrollWidth > innerWidth + 1
      };
    });
    expect(layout.overflow, `${width}px document`).toBe(false);
    expect(layout.titleClipped, `${width}px title`).toBe(false);
    expect(layout.title.right).toBeLessThanOrEqual(width);
    expect(layout.title.bottom).toBeLessThanOrEqual(layout.header.bottom);
    expect(layout.heading.top).toBeGreaterThanOrEqual(layout.header.bottom);
    expect(layout.name.top).toBeGreaterThanOrEqual(layout.account.bottom);
    expect(layout.affiliation.top).toBeGreaterThanOrEqual(layout.name.bottom);
    expect(layout.affiliation.right).toBeLessThanOrEqual(width);
    for (const rect of layout.fragments) {
      expect(rect.left).toBeGreaterThanOrEqual(0);
      expect(rect.right).toBeLessThanOrEqual(width);
    }
    if (width < 600) {
      await page.locator('app-header .menu-toggle').click();
      const sidebar = await page.locator('app-sidebar .sidebar').boundingBox();
      expect(sidebar.y).toBeGreaterThanOrEqual(layout.header.bottom - 1);
    }
  }
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
});

test('the introduction is discoverable and leads into the eight main chapters', async ({ page, context }) => {
  const observed = await observe(page, context);
  const introduction = workshop.chapters[0];
  await page.goto(`${base}/workshop/workshop.md`);
  await expect(page.locator('h1:not(.visually-hidden)').first()).toContainText(introduction.pages[0].title);
  for (let number = 1; number <= 8; number += 1) {
    for (const [section, source] of workshop.chapters[number].pages.entries()) {
      const index = workshop.pages.findIndex(({ id }) => id === source.id);
      await expect(page.locator(`a[href$="?step=${index}"]`)).toContainText(`${number}-${section + 1}\uff5c`);
    }
  }
  await expect(page.locator('body')).not.toContainText(/SEC-\d{2}/);
  for (const id of ['learning-goals', 'scenario-overview', 'journey']) {
    const index = workshop.pages.findIndex((source) => source.id === id);
    const source = workshop.pages[index];
    const link = page.locator(`a[href$="?step=${index}"]`);
    await expect(link).toContainText(source.title);
    await link.click();
    await expect(page.locator('h2:not(.visually-hidden)').first()).toContainText(source.title);
    if (id === 'learning-goals') await expect(page.locator('table tbody tr')).toHaveCount(5);
    if (id === 'scenario-overview') {
      await expect(page.locator('pre code')).toContainText('GET /api/requests?department=engineering&status=pending');
    }
    if (id === 'journey') {
      await expect(page.locator('img[src$="/journey.svg"]')).toBeVisible();
      const rows = page.locator('table tbody tr');
      await expect(rows).toHaveCount(8);
      for (let number = 1; number <= 8; number += 1) {
        const range = `${number}-1\u301c${number}-${workshop.chapters[number].pages.length}`;
        const cell = rows.nth(number - 1).locator('td').first();
        await expect(cell).toContainText(`\u7b2c${number}\u7ae0`);
        await expect(cell.locator('span')).toHaveText(range);
        await expect(cell.locator('span')).toHaveCSS('white-space', 'nowrap');
      }
    }
  }
  const firstMainPage = workshop.chapters[1].pages[0];
  const mainIndex = workshop.pages.findIndex(({ id }) => id === firstMainPage.id);
  await page.locator(`a[href$="?step=${mainIndex}"]`).click();
  await expect(page.locator('h2:not(.visually-hidden)').first()).toContainText(firstMainPage.title);
  await expect(page).toHaveTitle(/1-1\uff5c/);
  await page.getByRole('button', { name: /previous page:/i }).click();
  await expect(page.locator('h2:not(.visually-hidden)').first()).toContainText(introduction.pages.at(-1).title);
  const lastFirstPage = workshop.chapters[1].pages.at(-1);
  const lastFirstIndex = workshop.pages.findIndex(({ id }) => id === lastFirstPage.id);
  await page.locator(`a[href$="?step=${lastFirstIndex}"]`).click();
  await page.getByRole('button', { name: /next page:/i }).click();
  await expect(page.locator('h2:not(.visually-hidden)').first()).toContainText('2-1\uff5c');
  await page.getByRole('button', { name: /previous page:/i }).click();
  await expect(page.locator('h2:not(.visually-hidden)').first()).toContainText(lastFirstPage.title);
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
});

test('all pages, real code, SVG loading and every collapsed hint work in the official viewer', async ({ page, context }) => {
  const observed = await observe(page, context);
  await page.goto(`${base}/workshop/workshop.md`);
  for (let i = 0; i < workshop.pages.length; i += 1) {
    const source = workshop.pages[i];
    await expect(page.locator('h1:not(.visually-hidden),h2:not(.visually-hidden)').first()).toContainText(source.title);
    await expect(page).toHaveTitle(`${workshop.meta.short_title} - ${source.title}`);
    await expectWorkshopFooter(page);
    const details = page.locator('details');
    await expect(details).toHaveCount((source.visible.match(/<details>/g) ?? []).length);
    expect(await page.locator('details[open]').count()).toBe(0);
    if (/^sec0[1-8]-/.test(source.id)) {
      await expect(page.getByText('\u3053\u306e\u7bc0\u306e\u30b4\u30fc\u30eb:', { exact: true })).toBeVisible();
      for (const heading of ['\u6f14\u7fd2', '\u7d50\u679c\u3092\u78ba\u304b\u3081\u308b']) {
        await expect(page.getByRole('heading', { name: new RegExp(`^${heading}\\s*#?$`) })).toBeVisible();
      }
    }
    for (let d = 0; d < await details.count(); d += 1) {
      const detail = details.nth(d);
      await detail.locator('summary').click();
      await expect(detail).toHaveAttribute('open', '');
      await detail.locator('summary').click();
      await expect(detail).not.toHaveAttribute('open', '');
    }
    const actualCode = (await page.locator('pre code').allTextContents())
      .map((text) => text.replaceAll('\r\n', '\n').replace(/\n$/, ''));
    expect(actualCode, source.id).toEqual(source.codeBlocks);
    const prose = await page.locator('body').evaluate((body) => {
      const copy = body.cloneNode(true);
      copy.querySelectorAll('pre, code, script, style').forEach((node) => node.remove());
      return copy.textContent;
    });
    expect(prose, `unrendered emphasis in ${source.id}`).not.toContain('**');
    for (const match of source.visible.matchAll(/!\[[^\]]+\]\(assets\/([^)]*)\)/g)) {
      const image = page.locator(`img[src$="/${match[1]}"]`);
      await expect(image).toHaveCount(1);
      await expect(image).toBeVisible();
      expect(await image.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    }
    if (i + 1 < workshop.pages.length) {
      await page.getByRole('button', { name: /next page:/i }).click();
      await expect(page).toHaveURL(new RegExp(`step=${i + 1}(?:[&#]|$)`));
    }
  }
  await page.getByRole('button', { name: /previous page:/i }).click();
  await expect(page.locator('h1:not(.visually-hidden),h2:not(.visually-hidden)').first()).toContainText(workshop.pages.at(-2).title);
  await page.getByRole('button', { name: /next page:/i }).click();
  await expect(page.locator('h1:not(.visually-hidden),h2:not(.visually-hidden)').first()).toContainText(workshop.pages.at(-1).title);
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
});

test('table of contents, deep links, reload and keyboard hints work', async ({ page, context }) => {
  const observed = await observe(page, context);
  await page.goto(`${base}/workshop/workshop.md?step=4`);
  await expect(page.locator('h1:not(.visually-hidden),h2:not(.visually-hidden)').first()).toContainText(workshop.pages[4].title);
  await page.locator(`a[href$="?step=11"]`).click();
  await expect(page.locator('h1:not(.visually-hidden),h2:not(.visually-hidden)').first()).toContainText(workshop.pages[11].title);
  await page.reload();
  await expect(page.locator('h1:not(.visually-hidden),h2:not(.visually-hidden)').first()).toContainText(workshop.pages[11].title);
  const summary = page.locator('details summary').first();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details').first()).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(page.locator('details').first()).not.toHaveAttribute('open', '');
  await page.goBack();
  await expect(page.locator('h1:not(.visually-hidden),h2:not(.visually-hidden)').first()).toContainText(workshop.pages[4].title);
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
});

test('narrow pages do not overflow and diagrams retain readable text', async ({ page, context }) => {
  const observed = await observe(page, context);
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < workshop.pages.length; i += 1) {
    await page.goto(`${base}/workshop/workshop.md?step=${i}`);
    await expect(page.locator('h1:not(.visually-hidden),h2:not(.visually-hidden)').first()).toContainText(workshop.pages[i].title);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow, workshop.pages[i].id).toBe(false);
    for (const image of await page.locator('img[src*="/workshops/assets/"]').all()) {
      const width = await image.evaluate((img) => img.getBoundingClientRect().width);
      expect(width * 16 / 360).toBeGreaterThanOrEqual(14);
    }
  }
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
});

test('every SVG parses, its labels fit, and connectors do not cross text', async ({ page, context }) => {
  const observed = await observe(page, context);
  for (const asset of workshop.assets) {
    await page.goto(`${base}/workshops/assets/${path.basename(asset)}`);
    const result = await page.evaluate(() => {
      if (document.querySelector('parsererror')) return { errors: ['XML parse error'] };
      const svg = document.querySelector('svg');
      if (!svg) return { errors: ['missing SVG root'] };
      const view = svg.viewBox.baseVal;
      const errors = [];
      const rectangles = [...svg.querySelectorAll('rect')].map((rect) => rect.getBBox());
      const paths = [...svg.querySelectorAll('path')].filter((item) => !item.closest('defs'));
      for (const id of svg.getAttribute('aria-labelledby').split(/\s+/)) {
        if (!document.getElementById(id)) errors.push(`missing accessible label ${id}`);
      }
      for (const text of svg.querySelectorAll('text')) {
        const b = text.getBBox();
        const x = Number(text.getAttribute('x'));
        const y = Number(text.getAttribute('y'));
        if (b.x < view.x || b.y < view.y || b.x + b.width > view.width || b.y + b.height > view.height) {
          errors.push(`outside viewBox: ${text.textContent}`);
        }
        const box = rectangles.find((rect) => x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height);
        if (box && (b.x < box.x + 4 || b.x + b.width > box.x + box.width - 4 || b.y < box.y || b.y + b.height > box.y + box.height)) {
          errors.push(`outside box: ${text.textContent}`);
        }
        for (const connector of paths) {
          for (let distance = 0; distance <= connector.getTotalLength(); distance += 2) {
            const point = connector.getPointAtLength(distance);
            if (point.x > b.x && point.x < b.x + b.width && point.y > b.y && point.y < b.y + b.height) {
              errors.push(`connector crosses text: ${text.textContent}`);
              break;
            }
          }
        }
      }
      return { errors };
    });
    expect(result.errors, path.basename(asset)).toEqual([]);
  }
  expect(observed.external).toEqual([]);
  expect(observed.errors).toEqual([]);
});
