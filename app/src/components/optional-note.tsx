import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** Follows a label, inside its text: quieter, so it reads as a note and not as part of the name. */
export function OptionalNote() {
  const { text } = useTheme();

  return <Text style={[text.meta, styles.note]}> · optional</Text>;
}

const styles = StyleSheet.create({
  note: {
    textTransform: 'none',
    letterSpacing: 0,
  },
});
