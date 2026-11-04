import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** A small uppercase label. With a status color, it takes that color and has a dot before it. */
export function StatusLabel({
  label,
  color,
}: {
  label: string;
  color?: string;
}) {
  const { radius, space, text } = useTheme();

  return (
    <View style={[styles.label, { gap: space.sm }]}>
      {color !== undefined && (
        <View
          style={[
            styles.dot,
            { borderRadius: radius.check, backgroundColor: color },
          ]}
        />
      )}
      <Text style={[text.eyebrow, color !== undefined && { color }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
  },
});
