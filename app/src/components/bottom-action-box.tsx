import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';

interface BottomActionBoxProps {
  /** It sits on the tab bar, which keeps the room for the phone's bottom edge. */
  aboveTabBar?: boolean;
  children: ReactNode;
}

/** The screen's actions, pinned to the bottom: the primary button first, the secondary one below it. */
export function BottomActionBox({
  aboveTabBar = false,
  children,
}: BottomActionBoxProps) {
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
          // Above a navigation bar or home indicator, the same space as at the top, so buttons never touch it.
          paddingBottom: aboveTabBar
            ? actionBoxPadding.top
            : Math.max(
                insets.bottom + actionBoxPadding.top,
                actionBoxPadding.bottom,
              ),
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
