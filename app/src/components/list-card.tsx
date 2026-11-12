import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** Rows in one card, each drawing the line above it. */
export function ListCard({ children }: { children: ReactNode }) {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
