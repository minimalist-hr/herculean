import { View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** Marks a feedback reply the user hasn't opened. The label next to it says so to screen readers. */
export function UnreadDot() {
  const { colors, radius } = useTheme();

  return (
    <View
      testID="unread-dot"
      style={{
        width: dotSize,
        height: dotSize,
        borderRadius: radius.check,
        backgroundColor: colors.primary,
      }}
    />
  );
}

/** The size of a status dot. */
export const dotSize = 8;
