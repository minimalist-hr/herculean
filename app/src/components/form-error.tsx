import { Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** Says a part of a form couldn't load, in that part's place. */
export function FormError({ message }: { message: string }) {
  const { colors, text } = useTheme();

  return (
    <Text
      accessibilityRole="alert"
      style={[text.body, { color: colors.danger }]}
    >
      {message}
    </Text>
  );
}
