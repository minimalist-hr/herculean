import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { SkeletonLine, textLine } from './skeleton';

/** A label with nothing to say yet, which keeps its line's room. */
export const blankLine = '\u00A0';

interface ScreenHeadingProps {
  /** The small uppercase line above the title, for example "Welcome to Herculean". Null while it loads. */
  label?: string | null;
  /** Null while it loads. */
  title: string | null;
  subtitle?: string;
  /** A header icon button beside the title. */
  action?: ReactNode;
}

export function ScreenHeading({
  label,
  title,
  subtitle,
  action,
}: ScreenHeadingProps) {
  const { colors, space, text } = useTheme();

  return (
    <View style={{ gap: space.xs }}>
      {label === null && (
        <SkeletonLine width={180} height={10} lineHeight={textLine.eyebrow} />
      )}
      {typeof label === 'string' && <Text style={text.eyebrow}>{label}</Text>}
      <View style={[styles.titleRow, { gap: space.sm }]}>
        {title === null ? (
          <SkeletonLine
            width={220}
            height={28}
            lineHeight={textLine.pageTitle}
          />
        ) : (
          <Text
            accessibilityRole="header"
            style={[text.pageTitle, styles.title, { color: colors.text }]}
          >
            {title}
          </Text>
        )}
        {action}
      </View>
      {subtitle !== undefined && (
        <Text style={[text.body, { color: colors.muted }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
});
