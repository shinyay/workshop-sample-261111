function requireElement(parent, selector) {
  const element = parent.querySelector(selector);
  if (!element) throw new Error(`Missing viewer element: ${selector}`);
  return element;
}

function authorBlock(settings, icon) {
  const block = document.createElement('div');
  block.className = 'workshop-author';
  block.dataset.workshopAuthor = '';
  const link = document.createElement('a');
  link.className = 'workshop-author-account';
  link.href = settings.profileUrl;
  link.setAttribute('aria-label', `GitHub アカウント: ${settings.account}`);
  const mark = icon.cloneNode(true);
  mark.setAttribute('aria-hidden', 'true');
  mark.setAttribute('focusable', 'false');
  link.append(mark, document.createTextNode(settings.account));
  const name = document.createElement('div');
  name.className = 'workshop-author-name';
  name.textContent = settings.authorName;
  const affiliation = document.createElement('div');
  affiliation.className = 'workshop-author-affiliation';
  affiliation.textContent = settings.authorAffiliation;
  block.append(link, name, affiliation);
  return block;
}

function updatePresentation(root, settings) {
  const workshop = root.querySelector('app-workshop');
  const markdown = workshop?.querySelector('markdown');
  if (!markdown?.querySelector('h1, h2')) return;

  const footer = requireElement(workshop, 'app-footer footer.small');
  const icon = requireElement(footer, 'app-icon[name="mark-github"]');
  const svg = requireElement(icon, 'svg.octicon-mark-github');
  let label = footer.querySelector('.workshop-footer-label');
  if (!label) {
    requireElement(footer, 'a[href="https://github.com/microsoft/moaw"]');
    label = document.createElement('span');
    label.className = 'workshop-footer-label';
    label.textContent = `${settings.footerTitle} (v${settings.version})`;
    footer.replaceChildren(icon, document.createTextNode(' '), label);
  }

  const heading = markdown.querySelector('h1:not(.visually-hidden)');
  if (heading && !heading.nextElementSibling?.matches('[data-workshop-author]')) {
    heading.after(authorBlock(settings, svg));
    heading.dataset.workshopAuthorHeading = '';
  }
}

let observer;
function reportFailure(error) {
  observer?.disconnect();
  console.error('Workshop presentation failed:', error);
  const alert = document.createElement('p');
  alert.className = 'workshop-presentation-error';
  alert.setAttribute('role', 'alert');
  alert.textContent = '教材の作成者・フッター表示を適用できませんでした。詳しくはブラウザーのコンソールを確認してください。';
  document.body.prepend(alert);
}

try {
  const settings = JSON.parse(requireElement(document, '#workshop-presentation-settings').textContent);
  const root = requireElement(document, 'app-root');
  const update = () => {
    try {
      updatePresentation(root, settings);
    } catch (error) {
      reportFailure(error);
    }
  };
  observer = new MutationObserver(update);
  observer.observe(root, { childList: true, subtree: true });
  update();
} catch (error) {
  reportFailure(error);
}
