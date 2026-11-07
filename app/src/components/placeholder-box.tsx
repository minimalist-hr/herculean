import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** The dashed box that stands where content will be: an empty state, no matches, or a failure. */
export function PlaceholderBox({
  children,
  roomBelow,
}: {
  children: ReactNode;
  /** The space under the last line, when it isn't the usual padding. */
  roomBelow?: number;
}) {
  const { colors, radius, space } = useTheme();

  return (
    <View
      style={[
        styles.box,
        {
          gap: space.xs,
          padding: space.xl,
          paddingBottom: roomBelow ?? space.xl,
          borderRadius: radius.card,
          borderColor: colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
