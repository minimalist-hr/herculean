import { StyleSheet, type TextStyle } from 'react-native';

import { tokens } from './tokens';

export type ColorScheme = 'dark' | 'light';

/** The themes on Settings › Themes, by the name the API uses. */
export type ThemeName = keyof typeof tokens.color.themes;

export const defaultTheme: ThemeName = 'default';

type ColorName =
  | keyof typeof tokens.color.themes.default.colors
  | keyof typeof tokens.color.status.dark
  | 'scrim';

export type Colors = Record<ColorName, string>;

type TextRole =
  | Exclude<keyof typeof tokens.font.roles, 'tabLabel'>
  | 'tabLabelActive'
  | 'tabLabelInactive';

export interface Theme {
  name: ThemeName;
  /** Whether the theme is dark or light. */
  scheme: ColorScheme;
  colors: Colors;
  /** One muted color per weekday, for the week plan on the Routines tab. */
  dayColors: Record<keyof typeof tokens.color.day.dark, string>;
  radius: Record<keyof typeof tokens.radius.default, number>;
  /** The width of every border and divider: 1 px, or the thinnest the phone draws. */
  line: number;
  /** A card's border width: none when cards stand out by their color alone. */
  cardLine: number;
  /** The tab bar, rest and Resume bars and sheets are frosted. */
  glass: boolean;
  space: typeof tokens.space;
  opacity: {
    dimmed: number;
    pressed: number;
    disabled: number;
    pulse: number;
    glow: number;
  };
  motion: typeof tokens.motion;
  size: typeof tokens.size;
  text: Record<TextRole, TextStyle>;
}

// Each weight is its own font file, so React Native picks the family, not a fontWeight.
const fontFamilies = {
  400: 'ChakraPetch_400Regular',
  500: 'ChakraPetch_500Medium',
  600: 'ChakraPetch_600SemiBold',
  700: 'ChakraPetch_700Bold',
} as const;

interface Role {
  size: number;
  weight?: keyof typeof fontFamilies;
  /** A multiple of the size. */
  lineHeight?: number;
  /** In em, for example '0.06em'. */
  letterSpacing?: string;
  uppercase?: boolean;
  color?: 'muted';
}

export function createTheme(name: ThemeName): Theme {
  const theme = tokens.color.themes[name];
  const scheme = theme.mode;
  const colors: Colors = {
    ...theme.colors,
    ...tokens.color.status[scheme],
    // A theme's status colors never match its accent.
    ...('status' in theme && theme.status),
    scrim: tokens.color.scrim,
  };
  const border = tokens.border[theme.border];
  const line =
    border.line === 'hairline' ? StyleSheet.hairlineWidth : border.line;
  const { roles } = tokens.font;

  return {
    name,
    scheme,
    colors,
    dayColors: tokens.color.day[scheme],
    radius: tokens.radius[theme.corners],
    line,
    cardLine: border.cardOutline ? line : 0,
    glass: border.glass,
    space: tokens.space,
    opacity: {
      dimmed: tokens.opacity.dimmed,
      pressed: tokens.opacity.pressed,
      disabled: tokens.opacity.disabled,
      pulse: tokens.opacity.pulse,
      // The soft accent light behind the logo is stronger on dark than on light.
      glow: tokens.opacity.glow[scheme],
    },
    motion: tokens.motion,
    size: tokens.size,
    text: {
      pageTitle: toTextStyle(roles.pageTitle, colors),
      greeting: toTextStyle(roles.greeting, colors),
      heroStat: toTextStyle(roles.heroStat, colors),
      cardTitle: toTextStyle(roles.cardTitle, colors),
      bigStat: toTextStyle(roles.bigStat, colors),
      statValue: toTextStyle(roles.statValue, colors),
      listItemName: toTextStyle(roles.listItemName, colors),
      input: toTextStyle(roles.input, colors),
      primaryButton: toTextStyle(roles.primaryButton, colors),
      body: toTextStyle(roles.body, colors),
      secondaryButton: toTextStyle(roles.secondaryButton, colors),
      dayName: toTextStyle(roles.dayName, colors),
      eyebrow: toTextStyle(roles.eyebrow, colors),
      meta: toTextStyle(roles.meta, colors),
      quickPick: toTextStyle(roles.quickPick, colors),
      notification: toTextStyle(roles.notification, colors),
      chip: toTextStyle(roles.chip, colors),
      stepperValue: toTextStyle(roles.stepperValue, colors),
      wordmark: toTextStyle(roles.wordmark, colors),
      tabLabelActive: toTextStyle(
        { ...roles.tabLabel, weight: roles.tabLabel.weightActive },
        colors,
      ),
      tabLabelInactive: toTextStyle(
        { ...roles.tabLabel, weight: roles.tabLabel.weightInactive },
        colors,
      ),
    },
  };
}

function toTextStyle(role: Role, colors: Colors): TextStyle {
  return {
    fontFamily: fontFamilies[role.weight ?? 400],
    fontSize: role.size,
    // Tabular numbers line up weights, reps and timers.
    fontVariant: ['tabular-nums'],
    // Android adds font padding above the text, so it sits low in its box. iOS has none.
    includeFontPadding: false,
    ...(role.lineHeight !== undefined && {
      lineHeight: round(role.size * role.lineHeight),
    }),
    ...(role.letterSpacing !== undefined && {
      letterSpacing: round(role.size * Number.parseFloat(role.letterSpacing)),
    }),
    ...(role.uppercase && { textTransform: 'uppercase' }),
    ...(role.color !== undefined && { color: colors[role.color] }),
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
