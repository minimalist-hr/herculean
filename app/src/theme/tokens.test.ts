import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { tokens } from './tokens';

interface DesignTheme {
  default?: boolean;
  mode: string;
  corners: string;
  border: string;
  colors: unknown;
  status?: unknown;
}

interface DesignTokens {
  color: {
    themes: Record<string, DesignTheme>;
    day: unknown;
    status: unknown;
    scrim: string;
  };
  radius: unknown;
  border: Record<string, unknown>;
  glass: Record<string, unknown>;
  font: { roles: unknown };
  space: unknown;
  opacity: unknown;
  motion: unknown;
  size: unknown;
}

const design = JSON.parse(
  readFileSync(
    join(__dirname, '../../../docs/design/tokens/design-tokens.json'),
    'utf8',
  ),
) as DesignTokens;

test('themes match the design, by the names the API uses', () => {
  const themes = Object.fromEntries(
    Object.entries(design.color.themes).map(
      ([name, { default: _default, ...theme }]) => [name.toLowerCase(), theme],
    ),
  );

  expect(tokens.color.themes).toEqual(themes);
});

test('Default is the design’s default theme', () => {
  expect(design.color.themes.Default.default).toBe(true);
});

test('status and day colors and the scrim match the design', () => {
  expect(tokens.color.status).toEqual(design.color.status);
  expect(tokens.color.day).toEqual(design.color.day);
  expect(tokens.color.scrim).toBe(design.color.scrim);
});

test('corner scales and border styles match the design', () => {
  const { $description: _description, ...border } = design.border;

  expect(tokens.radius).toEqual(design.radius);
  expect(tokens.border).toEqual(border);
});

test('glass matches the design', () => {
  const { $description: _description, ...glass } = design.glass;

  expect(tokens.glass).toEqual(glass);
});

test('type roles match the design', () => {
  expect(tokens.font.roles).toEqual(design.font.roles);
});

test('sizes match the design', () => {
  expect(tokens.size).toEqual(design.size);
});

test('spacing matches the design', () => {
  expect(tokens.space).toEqual(design.space);
});

test('opacity and motion match the design', () => {
  expect(tokens.opacity).toEqual(design.opacity);
  expect(tokens.motion).toEqual(design.motion);
});
