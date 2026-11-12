import { createTheme, type ThemeName } from './theme';
import { tokens } from './tokens';

/** WCAG relative luminance of a #RRGGBB color. */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const themes = Object.keys(tokens.color.themes) as ThemeName[];

describe.each(themes)('%s', (name) => {
  const { colors, dayColors } = createTheme(name);
  const surfaces = [colors.bg, colors.card, colors.raised];

  /** Every pair that fails, so a failure names the colors. */
  function passes(color: string, ratio: number) {
    const failing = surfaces
      .filter((surface) => contrast(color, surface) < ratio)
      .map((surface) => `${color} on ${surface}`);

    expect(failing).toEqual([]);
  }

  test('text passes 7:1', () => {
    passes(colors.text, 7);
  });

  test('muted, accent text, status and weekday colors pass 4.5:1', () => {
    for (const color of [
      colors.muted,
      colors.primaryText,
      colors.success,
      colors.skipped,
      colors.danger,
      ...Object.values(dayColors),
    ]) {
      passes(color, 4.5);
    }
  });

  test('the accent and the warning icon pass 3:1', () => {
    passes(colors.primary, 3);
    passes(colors.warn, 3);
  });

  test('text on the accent passes 4.5:1', () => {
    expect(contrast(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  test('status colors never match the accent', () => {
    for (const color of [colors.success, colors.skipped, colors.danger]) {
      expect(color).not.toBe(colors.primaryText);
      expect(color).not.toBe(colors.primary);
    }
  });
});
