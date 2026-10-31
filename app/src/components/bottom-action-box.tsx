import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';

/** The screen's actions, pinned to the bottom: the primary button first, the secondary one below it. */
export function BottomActionBox({ children }: { children: ReactNode }) {
  const { colors, size } = useTheme();
  const insets = useSafeAreaInsets();
  const { actionBoxPadding } = size;

  return (
    <View
      style={[
        styles.box,
        {
          gap: size.gap.stackedButtons,
          paddingTop: actionBoxPadding.top,
          paddingHorizontal: actionBoxPadding.x,
          // Clears the home indicator on phones that have one.
          paddingBottom: Math.max(insets.bottom, actionBoxPadding.bottom),
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderTopWidth: 1,
  },
});
