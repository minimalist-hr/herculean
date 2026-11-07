// Checks that every captured screen is in the screen index, that every screen's files sit in its area's folder, and that the design document names every screen.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { areaOf, areaPath } from './areas.mjs';
import { screens } from './screens.mjs';

const designDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const index = readFileSync(join(designDir, 'screen-index.md'), 'utf8');
const document = readFileSync(join(designDir, 'design-document.md'), 'utf8');
const rows = new Map([...index.matchAll(/^\| ([A-Z]\d\d) \| .*?\(source\/([^)]+)\.dc\.html\) \|$/gm)].map(([, id, path]) => [id, path]));
const problems = [];

for (const screen of screens) {
  if (rows.get(screen.id) !== `${areaOf(screen.id)}/${screen.file}`) {
    problems.push(`${screen.id} is in screens.mjs but not in the screen index as ${screen.file}.`);
  }
}

// Every screen in the index, drawn or captured, has its three files in its area's folder.
for (const [id, path] of rows) {
  const file = path.split('/').at(-1);
  if (path !== `${areaOf(id)}/${file}`) {
    problems.push(`${id} isn't in the ${areaOf(id)} folder.`);
  }
  for (const [folder, extension] of [['screens', 'png'], ['html', 'html'], ['source', 'dc.html']]) {
    if (!existsSync(join(designDir, folder, areaPath(file, extension)))) {
      problems.push(`${id} has no ${folder}/${areaPath(file, extension)}.`);
    }
  }
}

for (const id of rows.keys()) {
  if (!new RegExp(`\\b${id}\\b`).test(document)) {
    problems.push(`${id} is in the screen index but not in the design document.`);
  }
}

const count = Number(index.match(/^(\d+) screens\./m)?.[1]);
if (count !== rows.size) {
  problems.push(`The screen index says ${String(count)} screens but lists ${String(rows.size)}.`);
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`${String(screens.length)} captured screens and ${String(rows.size)} index rows match.`);
