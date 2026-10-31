import { Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** An error that belongs to no field, at the top of the form, above the first field. */
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
