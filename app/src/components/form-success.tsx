import { Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** Says something worked, at the top of the form, above the first field. */
export function FormSuccess({ message }: { message: string }) {
  const { colors, text } = useTheme();

  return (
    <Text
      accessibilityRole="alert"
      style={[text.body, { color: colors.success }]}
    >
      {message}
    </Text>
  );
}
