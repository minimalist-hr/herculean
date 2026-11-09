import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const apiModules = join(__dirname, '../../api/src/modules');

function filesUnder(folder: string, wanted: (name: string) => boolean) {
  return readdirSync(folder, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && wanted(entry.name))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((path) => !/[\\/](bin|obj)[\\/]/.test(path));
}

/** A line of code without its comment, which readers of the app never see. */
function codeOf(line: string) {
  if (/^\s*(\/\/|\/\*|\*|\{\/\*)/.test(line)) {
    return '';
  }

  const comment = line.indexOf(' // ');

  return comment === -1 ? line : line.slice(0, comment);
}

function linesWith(paths: string[], pattern: RegExp, only = /./) {
  return paths.flatMap((path) =>
    readFileSync(path, 'utf8')
      .split('\n')
      .map(codeOf)
      .filter((line) => only.test(line) && pattern.test(line))
      .map((line) => `${path}: ${line.trim()}`),
  );
}

const appFiles = filesUnder(
  __dirname,
  (name) =>
    /\.tsx?$/.test(name) && !name.includes('.test.') && name !== 'schema.ts',
);
const apiFiles = filesUnder(apiModules, (name) =>
  /(Errors|Validator|Rules)\.cs$/.test(name),
);
const straightApostrophe = /[A-Za-z]'[a-z]|&apos;/;

test('the app has no straight apostrophes', () => {
  expect(linesWith(appFiles, straightApostrophe)).toEqual([]);
});

test('the messages the API sends have no straight apostrophes', () => {
  expect(
    linesWith(apiFiles, straightApostrophe, /Error\.|WithMessage\(/),
  ).toEqual([]);
});

test('no value is one dash, never an em dash', () => {
  expect(linesWith(appFiles, /—/)).toEqual([]);
});
