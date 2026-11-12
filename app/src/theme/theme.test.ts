import { StyleSheet } from 'react-native';

import { createTheme } from './theme';

test('a theme takes its own colors and the shared status colors of its mode', () => {
  const { scheme, colors } = createTheme('default');

  expect(scheme).toBe('dark');
  expect(colors.bg).toBe('#050506');
  expect(colors.primary).toBe('#2A62F0');
  expect(colors.success).toBe('#4ADE80');
});

test('a light theme uses the light status and day colors', () => {
  const { scheme, colors, dayColors } = createTheme('fjord');

  expect(scheme).toBe('light');
  expect(colors.bg).toBe('#ECEFF4');
  expect(colors.success).toBe('#166534');
  expect(dayColors.wednesday).toBe('#376679');
});

test('a theme’s own status colors win over the shared ones', () => {
  expect(createTheme('emerald').colors.success).toBe('#60A5FA');
  expect(createTheme('latte').colors.skipped).toBe('#6E6259');
  expect(createTheme('latte').colors.success).toBe('#166534');
});

test('each theme has its corner scale', () => {
  expect(createTheme('mono').radius.card).toBe(2);
  expect(createTheme('default').radius.card).toBe(6);
  expect(createTheme('fjord').radius.card).toBe(8);
  expect(createTheme('latte').radius.card).toBe(12);
  expect(createTheme('frost').radius.control).toBe(999);
});

test('border styles set the line, the card outline and glass', () => {
  expect(createTheme('default')).toMatchObject({
    line: 1,
    cardLine: 1,
    glass: false,
  });
  expect(createTheme('paper')).toMatchObject({
    line: StyleSheet.hairlineWidth,
    cardLine: StyleSheet.hairlineWidth,
    glass: false,
  });
  expect(createTheme('latte')).toMatchObject({
    line: 1,
    cardLine: 0,
    glass: false,
  });
  expect(createTheme('smoke')).toMatchObject({
    line: StyleSheet.hairlineWidth,
    cardLine: 0,
    glass: true,
  });
});

test('type roles become text styles with the right font, sizes, tabular numbers and no Android font padding', () => {
  const { text } = createTheme('default');

  expect(text.pageTitle).toEqual({
    fontFamily: 'ChakraPetch_700Bold',
    fontSize: 32,
    lineHeight: 33.6,
    letterSpacing: -0.32,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  });
  expect(text.primaryButton).toMatchObject({
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  });
  expect(text.body).toMatchObject({
    fontFamily: 'ChakraPetch_400Regular',
    fontSize: 14,
    lineHeight: 21,
  });
});

test('muted roles use the muted color', () => {
  const { colors, text } = createTheme('paper');

  expect(text.eyebrow.color).toBe(colors.muted);
  expect(text.meta.color).toBe(colors.muted);
});

test('tab labels have an active and an inactive weight', () => {
  const { text } = createTheme('default');

  expect(text.tabLabelActive).toMatchObject({
    fontFamily: 'ChakraPetch_700Bold',
    letterSpacing: 0.44,
  });
  expect(text.tabLabelInactive.fontFamily).toBe('ChakraPetch_500Medium');
});

test('the glow opacity follows the mode', () => {
  expect(createTheme('default').opacity.glow).toBe(0.2);
  expect(createTheme('frost').opacity.glow).toBe(0.1);
});
