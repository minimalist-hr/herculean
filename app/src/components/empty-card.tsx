import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { PlaceholderBox } from './placeholder-box';

/** Stands where something will show once there is some, or when nothing matches. */
export function EmptyCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const { colors, text } = useTheme();

  return (
    <PlaceholderBox>
      <Text
        style={[text.listItemName, styles.centered, { color: colors.text }]}
      >
        {title}
      </Text>
      <Text style={[text.meta, styles.centered]}>{message}</Text>
    </PlaceholderBox>
  );
}

const styles = StyleSheet.create({
  centered: {
    textAlign: 'center',
  },
});
