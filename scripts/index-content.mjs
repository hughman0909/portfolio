// Refresh static-host file lists before publishing: node scripts/index-content.mjs
import { readdir, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
async function markdownFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const lists = await Promise.all(entries.map(async entry => {
    const path = prefix + entry.name;
    if (entry.isDirectory()) return markdownFiles(new URL(entry.name + '/', directory), path + '/');
    return entry.name.endsWith('.md') && !/^sample(?:\.en)?\.md$/.test(entry.name) ? [path] : [];
  }));
  return lists.flat().sort();
}
for (const name of ['projects', 'writeups']) {
  const directory = new URL(name + '/', root);
  const files = await markdownFiles(directory);
  await writeFile(new URL('index.json', directory), JSON.stringify({ files }, null, 2) + '\n');
  console.log(`${name}: ${files.length} Markdown files`);
}
