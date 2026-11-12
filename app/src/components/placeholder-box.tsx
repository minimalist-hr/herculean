import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { appear, disappear } from '@/theme/motion';
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
  const { colors, line, radius, space } = useTheme();

  return (
    <Animated.View
      entering={appear}
      exiting={disappear}
      style={[
        styles.box,
        {
          borderWidth: line,
          gap: space.xs,
          padding: space.xl,
          paddingBottom: roomBelow ?? space.xl,
          borderRadius: radius.card,
          borderColor: colors.border,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    borderStyle: 'dashed',
  },
});
