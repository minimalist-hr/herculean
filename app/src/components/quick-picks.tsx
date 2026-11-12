import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { Tappable } from './tappable';

interface QuickPicksProps<T extends string | number> {
  values: readonly T[];
  /** The current value. A pick that matches it is filled. */
  selected: T;
  onSelect: (value: T) => void;
  format: (value: T) => string;
  formatSpoken: (value: T) => string;
  /** Names the row for screen readers, for example "Time range". */
  label?: string;
  /** They aren't available yet, but a press can say why. */
  muted?: boolean;
}

/** A row of common values to set with one tap, for example rest times. */
export function QuickPicks<T extends string | number>({
  values,
  selected,
  onSelect,
  format,
  formatSpoken,
  label = 'Quick picks',
  muted = false,
}: QuickPicksProps<T>) {
  const { colors, line, opacity, radius, size, space, text } = useTheme();

  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel={label}
      style={[styles.row, { gap: space.xs }]}
    >
      {values.map((value) => {
        const isSelected = value === selected;
        return (
          <Tappable
            key={String(value)}
            accessibilityRole="button"
            accessibilityLabel={formatSpoken(value)}
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              onSelect(value);
            }}
            style={[
              styles.pick,
              {
                borderWidth: line,
                height: size.touchTargetMin,
                borderRadius: radius.control,
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primary : colors.raised,
                opacity: muted ? opacity.dimmed : 1,
              },
            ]}
          >
            <Text
              style={[
                text.quickPick,
                { color: isSelected ? colors.onPrimary : colors.text },
              ]}
            >
              {format(value)}
            </Text>
          </Tappable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  pick: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
