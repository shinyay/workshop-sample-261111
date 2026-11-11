import { checkLocalLinks, loadWorkshop } from './content.mjs';

try {
  const unknown = process.argv.slice(2).filter((arg) => arg !== '--publish');
  if (unknown.length) throw new Error(`Unknown check options: ${unknown.join(', ')}`);
  const workshop = loadWorkshop({ publish: process.argv.includes('--publish') });
  const links = checkLocalLinks();
  console.log(`Checked ${workshop.pages.length} pages, ${workshop.assets.length} SVGs, canonical AC rows, and ${links} local document links.`);
  for (const item of workshop.pending) console.log(`DRAFT PENDING: ${item}`);
} catch (error) {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
}
