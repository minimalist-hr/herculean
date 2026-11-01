import { createTheme } from './theme';

test('dark Racing blue uses the dark neutrals and the Racing blue accent', () => {
  const { colors } = createTheme('dark', 'racingBlue');

  expect(colors.bg).toBe('#050506');
  expect(colors.primary).toBe('#1A55E6');
  expect(colors.success).toBe('#4ADE80');
});

test('light Titanium uses the light neutrals and the Titanium accent', () => {
  const { colors } = createTheme('light', 'titanium');

  expect(colors.bg).toBe('#F4F5F7');
  expect(colors.primary).toBe('#2A2D33');
  expect(colors.success).toBe('#166534');
});

test('type roles become text styles with the right font, sizes, tabular numbers and no Android font padding', () => {
  const { text } = createTheme('dark', 'racingBlue');

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
  const { colors, text } = createTheme('light', 'racingBlue');

  expect(text.eyebrow.color).toBe(colors.muted);
  expect(text.meta.color).toBe(colors.muted);
});

test('tab labels have an active and an inactive weight', () => {
  const { text } = createTheme('dark', 'racingBlue');

  expect(text.tabLabelActive).toMatchObject({
    fontFamily: 'ChakraPetch_700Bold',
    letterSpacing: 0.44,
  });
  expect(text.tabLabelInactive.fontFamily).toBe('ChakraPetch_500Medium');
});

test('the glow opacity follows the scheme', () => {
  expect(createTheme('dark', 'racingBlue').opacity.glow).toBe(0.2);
  expect(createTheme('light', 'racingBlue').opacity.glow).toBe(0.1);
});
