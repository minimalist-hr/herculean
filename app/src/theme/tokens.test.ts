import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { tokens } from './tokens';

interface DesignTokens {
  color: {
    neutral: unknown;
    day: { dark: unknown; light: unknown };
    accent: Record<
      'Nitro' | 'Chrome',
      { default?: boolean; dark: unknown; light: unknown }
    >;
    status: unknown;
    scrim: string;
  };
  radius: { sharp: unknown };
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

const { dark: nitroDark, light: nitroLight } = design.color.accent.Nitro;
const { dark: chromeDark, light: chromeLight } = design.color.accent.Chrome;

test('day colors match the design', () => {
  expect(tokens.color.day.dark).toEqual(design.color.day.dark);
  expect(tokens.color.day.light).toEqual(design.color.day.light);
});

test('neutral colors match the design', () => {
  expect(tokens.color.neutral).toEqual(design.color.neutral);
});

test('accent colors match the design', () => {
  expect(tokens.color.accent).toEqual({
    nitro: { dark: nitroDark, light: nitroLight },
    chrome: { dark: chromeDark, light: chromeLight },
  });
});

test('status colors and scrim match the design', () => {
  expect(tokens.color.status).toEqual(design.color.status);
  expect(tokens.color.scrim).toBe(design.color.scrim);
});

test('radius matches the sharp corners of the design', () => {
  expect(tokens.radius).toEqual(design.radius.sharp);
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
