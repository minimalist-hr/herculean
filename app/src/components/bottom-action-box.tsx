import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';

import { setNotificationInset } from './notifications';

/** The screen's actions, pinned to the bottom: the primary button first, the secondary one below it. */
export function BottomActionBox({ children }: { children: ReactNode }) {
  const { colors, size } = useTheme();
  const insets = useSafeAreaInsets();
  const { actionBoxPadding } = size;
  const [height, setHeight] = useState<number>();

  // A notification sits above the box while its screen is the one showing.
  useFocusEffect(
    useCallback(() => {
      if (height === undefined) {
        return;
      }

      setNotificationInset(height);

      return () => {
        setNotificationInset(null);
      };
    }, [height]),
  );

  return (
    <View
      onLayout={(event) => {
        setHeight(event.nativeEvent.layout.height);
      }}
      style={[
        styles.box,
        {
          gap: size.gap.stackedButtons,
          paddingTop: actionBoxPadding.top,
          paddingHorizontal: actionBoxPadding.x,
          // Above a navigation bar or home indicator, the same space as at the top, so buttons never touch it.
          paddingBottom: Math.max(
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
