import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { tokens } from './tokens';

interface DesignTokens {
  color: {
    neutral: unknown;
    accent: Record<
      'Racing blue' | 'Titanium',
      { default?: boolean; dark: unknown; light: unknown }
    >;
    status: unknown;
    scrim: string;
  };
  radius: { sharp: unknown };
  font: { roles: unknown };
  size: unknown;
}

const design = JSON.parse(
  readFileSync(
    join(__dirname, '../../../docs/design/tokens/design-tokens.json'),
    'utf8',
  ),
) as DesignTokens;

const { dark: racingBlueDark, light: racingBlueLight } =
  design.color.accent['Racing blue'];
const { dark: titaniumDark, light: titaniumLight } =
  design.color.accent.Titanium;

test('neutral colors match the design', () => {
  expect(tokens.color.neutral).toEqual(design.color.neutral);
});

test('accent colors match the design', () => {
  expect(tokens.color.accent).toEqual({
    racingBlue: { dark: racingBlueDark, light: racingBlueLight },
    titanium: { dark: titaniumDark, light: titaniumLight },
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
