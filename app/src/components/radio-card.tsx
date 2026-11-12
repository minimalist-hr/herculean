import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { Tappable } from './tappable';

interface RadioCardProps {
  label: string;
  /** A second line, for example "kg". */
  detail?: string;
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
  const { colors, line, radius, size, space, text } = useTheme();

  return (
    <Tappable
      accessibilityRole="radio"
      accessibilityLabel={detail === undefined ? label : `${label}, ${detail}`}
      accessibilityState={{ checked: selected }}
      onPress={onSelect}
      style={[
        styles.card,
        {
          borderWidth: line,
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
        {detail !== undefined && <Text style={text.meta}>{detail}</Text>}
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
    </Tappable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
