import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { FormPage } from '@/components/form-page';
import { CheckIcon } from '@/components/icons';
import { SectionTitle } from '@/components/section-title';
import { Tappable } from '@/components/tappable';
import { useCurrentUser } from '@/features/account/use-current-user';
import { createTheme, type ColorScheme } from '@/theme/theme';
import { useTheme } from '@/theme/theme-provider';
import { tokens } from '@/theme/tokens';

import { themeLabels } from './settings-labels';
import { useUpdateTheme } from './use-update-settings';

type ThemeName = components['schemas']['Theme'];

const themes = Object.keys(themeLabels) as ThemeName[];

const sections: { title: string; scheme: ColorScheme }[] = [
  { title: 'Dark', scheme: 'dark' },
  { title: 'Light', scheme: 'light' },
];

/** Themes, from Profile, or from Settings for an admin. A tap uses a theme at once. */
export function ThemesScreen({ back = 'Profile' }: { back?: string }) {
  const { name, space } = useTheme();
  const user = useCurrentUser();
  const update = useUpdateTheme();
  // The saved theme, which changes at once on a tap.
  const inUse = user.data?.theme ?? name;

  return (
    <FormPage
      back={back}
      title="Themes"
      subtitle="How Herculean looks. Fonts and sizes stay the same."
    >
      {sections.map((section) => (
        <View key={section.scheme} style={{ gap: space.md }}>
          <SectionTitle>{section.title}</SectionTitle>
          <View style={[styles.grid, { gap: space.md }]}>
            {themes
              .filter(
                (theme) => tokens.color.themes[theme].mode === section.scheme,
              )
              .map((theme) => (
                <ThemeCard
                  key={theme}
                  name={theme}
                  selected={theme === inUse}
                  onSelect={() => {
                    if (theme !== inUse) {
                      update.mutate(theme);
                    }
                  }}
                />
              ))}
          </View>
        </View>
      ))}
    </FormPage>
  );
}

interface ThemeCardProps {
  name: ThemeName;
  selected: boolean;
  onSelect: () => void;
}

/** A small screen drawn in the theme: its background, a card with two lines of text and a button, with its corners and borders. */
function ThemeCard({ name, selected, onSelect }: ThemeCardProps) {
  const { colors: appColors, space, text: appText } = useTheme();
  const preview = useMemo(() => createTheme(name), [name]);
  const { colors, radius, size, text } = preview;
  const label = themeLabels[name];

  return (
    <Tappable
      accessibilityRole="radio"
      accessibilityLabel={selected ? `${label}, selected` : label}
      accessibilityState={{ checked: selected }}
      onPress={onSelect}
      style={[styles.choice, { gap: space.xs }]}
    >
      <View
        style={{
          gap: space.sm,
          padding: space.md,
          borderRadius: radius.card,
          borderWidth: selected ? size.radio.ringWidth : preview.line,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <View
          style={{
            gap: space.xxs,
            padding: space.sm,
            borderRadius: radius.card,
            borderWidth: preview.cardLine,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <Text
            numberOfLines={1}
            style={[text.listItemName, { color: colors.text }]}
          >
            Push day
          </Text>
          <Text numberOfLines={1} style={text.meta}>
            6 exercises
          </Text>
        </View>
        <View
          style={[
            styles.button,
            {
              height: size.chip,
              borderRadius: radius.control,
              backgroundColor: colors.primary,
            },
          ]}
        >
          <Text style={[text.chip, { color: colors.onPrimary }]}>Start</Text>
        </View>
      </View>
      <View style={[styles.name, { gap: space.xxs }]}>
        <Text style={[appText.listItemName, { color: appColors.text }]}>
          {label}
        </Text>
        {selected && <CheckIcon color={appColors.primaryText} size={16} />}
      </View>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  choice: {
    // Two to a row, with the grid's gap between them.
    flexBasis: '45%',
    flexGrow: 1,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
