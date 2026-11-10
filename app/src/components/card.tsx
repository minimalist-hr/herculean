import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StatusLabel } from '@/components/status-label';
import { useTheme } from '@/theme/theme-provider';

export function Card({ children }: { children: ReactNode }) {
  const { colors, radius, space } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          gap: space.md,
          padding: space.lg,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function CardHeading({
  label,
  labelColor,
  title,
  meta,
}: {
  label: string;
  /** A status color: the label then has a dot before it. */
  labelColor?: string;
  title: string;
  meta: string;
}) {
  const { colors, space, text } = useTheme();

  return (
    <View style={{ gap: space.xs }}>
      <StatusLabel label={label} color={labelColor} />
      <Text style={[text.cardTitle, { color: colors.text }]}>{title}</Text>
      <Text style={text.meta}>{meta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
