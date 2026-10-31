import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

interface QuickPicksProps {
  values: readonly number[];
  /** The current value. A pick that matches it is filled. */
  selected: number;
  onSelect: (value: number) => void;
  format: (value: number) => string;
  formatSpoken: (value: number) => string;
}

/** A row of common values to set with one tap, for example rest times. */
export function QuickPicks({
  values,
  selected,
  onSelect,
  format,
  formatSpoken,
}: QuickPicksProps) {
  const { colors, radius, size, space, text } = useTheme();

  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel="Quick picks"
      style={[styles.row, { gap: space.xs }]}
    >
      {values.map((value) => {
        const isSelected = value === selected;
        return (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={formatSpoken(value)}
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              onSelect(value);
            }}
            style={[
              styles.pick,
              {
                height: size.touchTargetMin,
                borderRadius: radius.control,
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primary : colors.raised,
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
          </Pressable>
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
    borderWidth: 1,
  },
});
