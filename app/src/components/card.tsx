import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { NameLink } from '@/components/name-link';
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
  onTitlePress,
}: {
  label: string;
  /** A status color: the label then has a dot before it. */
  labelColor?: string;
  title: string;
  meta: string;
  /** Opens what the title names. It then has the open-out icon. */
  onTitlePress?: () => void;
}) {
  const { colors, space, text } = useTheme();

  return (
    <View style={{ gap: space.xs }}>
      <StatusLabel label={label} color={labelColor} />
      {onTitlePress === undefined ? (
        <Text style={[text.cardTitle, { color: colors.text }]}>{title}</Text>
      ) : (
        <NameLink name={title} style={text.cardTitle} onPress={onTitlePress} />
      )}
      <Text style={text.meta}>{meta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
