import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

interface RadioCardProps {
  label: string;
  /** A second line, for example "kg, cm". */
  detail: string;
  selected: boolean;
  onSelect: () => void;
}

/** One choice of a radio group, as a card. Put the cards in a view with the radiogroup role. */
export function RadioCard({
  label,
  detail,
  selected,
  onSelect,
}: RadioCardProps) {
  const { colors, radius, size, space, text } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${label}, ${detail}`}
      accessibilityState={{ checked: selected }}
      onPress={onSelect}
      style={[
        styles.card,
        {
          minHeight: size.optionRowMin,
          padding: space.md,
          gap: space.sm,
          borderRadius: radius.control,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.raised : 'transparent',
        },
      ]}
    >
      <View style={styles.text}>
        <Text style={[text.listItemName, { color: colors.text }]}>{label}</Text>
        <Text style={text.meta}>{detail}</Text>
      </View>
      <View
        style={[
          styles.ring,
          {
            width: size.radio.ring,
            height: size.radio.ring,
            borderWidth: size.radio.ringWidth,
            borderColor: selected ? colors.primary : colors.muted,
          },
        ]}
      >
        {selected && (
          <View
            style={[
              styles.dot,
              {
                width: size.radio.dot,
                height: size.radio.dot,
                backgroundColor: colors.primary,
              },
            ]}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  text: {
    flex: 1,
  },
  // Round is the shape of a radio button, not a corner choice.
  ring: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 999,
  },
});
