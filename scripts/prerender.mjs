import { readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const placeholder = '<div id="root"></div>';
const template = await readFile('dist/index.html', 'utf8');
if (!template.includes(placeholder)) throw new Error('root placeholder not found in dist/index.html');

const { render } = await import(pathToFileURL('dist-ssr/entry-server.js').href);
await writeFile('dist/index.html', template.replace(placeholder, `<div id="root">${render()}</div>`));
await rm('dist-ssr', { recursive: true, force: true });
console.log('prerendered dist/index.html');
