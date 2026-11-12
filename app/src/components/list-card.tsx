import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { appear, disappear } from '@/theme/motion';
import { useTheme } from '@/theme/theme-provider';

/** Rows in one card, each drawing the line above it. */
export function ListCard({ children }: { children: ReactNode }) {
  const { cardLine, colors, radius } = useTheme();

  return (
    <Animated.View
      entering={appear}
      exiting={disappear}
      style={[
        styles.card,
        {
          borderWidth: cardLine,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
