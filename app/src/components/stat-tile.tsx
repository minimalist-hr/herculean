import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SkeletonLine, textLine } from '@/components/skeleton';
import { StatusLabel } from '@/components/status-label';
import { useTheme } from '@/theme/theme-provider';

/** A labelled number in a card. Without a value, it shows a skeleton the size of that value. */
export function StatTile({
  label,
  labelColor,
  value,
  detail,
  skeletonWidth = 90,
  total = false,
  children,
}: {
  label: string;
  /** A status color: the label then has a dot before it, and the tile is shorter. */
  labelColor?: string;
  value?: number | string;
  /** A small line under the value. */
  detail?: string;
  skeletonWidth?: number;
  /** A period's total: its value shrinks to fit one line, and its detail line keeps its place while it loads. */
  total?: boolean;
  /** What shows below, for example a trend line. */
  children?: ReactNode;
}) {
  const { cardLine, colors, radius, size, space, text } = useTheme();
  const hasStatus = labelColor !== undefined;
  const loading = value === undefined;

  return (
    <View
      style={[
        styles.tile,
        {
          borderWidth: cardLine,
          gap: space.sm,
          paddingVertical: hasStatus ? space.md : size.statTilePadding,
          paddingHorizontal: size.statTilePadding,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {hasStatus ? (
        <StatusLabel label={label} color={labelColor} />
      ) : (
        <Text style={text.eyebrow}>{label}</Text>
      )}
      {loading ? (
        <SkeletonLine
          width={skeletonWidth}
          height={24}
          lineHeight={textLine.bigStat}
        />
      ) : (
        <Text
          numberOfLines={total ? 1 : undefined}
          adjustsFontSizeToFit={total}
          style={[text.bigStat, { color: colors.text }]}
        >
          {value}
        </Text>
      )}
      {total && loading && (
        <SkeletonLine width={110} height={12} lineHeight={textLine.meta} />
      )}
      {(total ? !loading : detail !== undefined) && (
        <Text style={text.meta}>{detail}</Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
  },
});
