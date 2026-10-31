import { Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

interface ScreenHeadingProps {
  /** The small uppercase line above the title, for example "Welcome to Herculean". */
  label?: string;
  title: string;
  subtitle?: string;
}

export function ScreenHeading({ label, title, subtitle }: ScreenHeadingProps) {
  const { colors, space, text } = useTheme();

  return (
    <View style={{ gap: space.xs }}>
      {label !== undefined && <Text style={text.eyebrow}>{label}</Text>}
      <Text
        accessibilityRole="header"
        style={[text.pageTitle, { color: colors.text }]}
      >
        {title}
      </Text>
      {subtitle !== undefined && (
        <Text style={[text.body, { color: colors.muted }]}>{subtitle}</Text>
      )}
    </View>
  );
}
