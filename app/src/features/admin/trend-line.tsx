import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { Skeleton } from '@/components/skeleton';
import { useTheme } from '@/theme/theme-provider';

const strokeWidth = 2;

/** A small line of weekly counts, oldest first, in the accent. Without values it holds its place: a skeleton, or nothing after a failure. */
export function TrendLine({
  values,
  loading = false,
  height = 24,
}: {
  values?: number[];
  loading?: boolean;
  /** Taller as the page's main focus. */
  height?: number;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  if (loading) {
    return <Skeleton width="100%" height={height} />;
  }

  const highest = Math.max(1, ...(values ?? []));
  const points = (values ?? [])
    .map((value, index, all) => {
      const x = all.length === 1 ? 0 : (index / (all.length - 1)) * width;
      const y =
        height - strokeWidth - (value / highest) * (height - strokeWidth * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <View
      testID="trend-line"
      style={{ height }}
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
    >
      {values !== undefined && width > 0 && (
        <Svg width={width} height={height}>
          <Polyline
            points={points}
            fill="none"
            stroke={colors.primaryText}
            strokeWidth={strokeWidth}
          />
        </Svg>
      )}
    </View>
  );
}
