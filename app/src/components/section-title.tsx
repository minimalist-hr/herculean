import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** The small uppercase title above a section. Screen readers can jump between these. */
export function SectionTitle({
  style,
  children,
}: {
  style?: StyleProp<TextStyle>;
  children: ReactNode;
}) {
  const { text } = useTheme();

  return (
    <Text accessibilityRole="header" style={[text.eyebrow, style]}>
      {children}
    </Text>
  );
}
