import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import type { components } from '@/api/schema';
import { QuickPicks } from '@/components/quick-picks';
import { SectionTitle } from '@/components/section-title';
import { Skeleton } from '@/components/skeleton';
import { TextLink } from '@/components/text-link';
import { formatShortDate, formatWeight, weightIn } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { dayNumber, monthLabels, weightTicks } from './chart-scale';
import {
  progressRanges,
  useExerciseProgress,
  type ProgressRange,
} from './use-exercise-progress';

type Point = components['schemas']['ProgressPointResponse'];
type Units = components['schemas']['Units'];

const chartHeight = 168;
// Past this many points the dots run together, so only the last one shows.
const maxDots = 20;
// Room for the weights on the left, the months below and the last point's ring.
const plot = { left: 30, right: 8, top: 10, bottom: 45 };
// Axis labels are text over the chart, so they use the app's font. Each is this wide, centered on its spot.
const labelWidth = 40;
const labelHeight = 14;

const rangeLabels: Record<ProgressRange, { short: string; spoken: string }> = {
  '3m': { short: '3M', spoken: 'Last 3 months' },
  '6m': { short: '6M', spoken: 'Last 6 months' },
  '1y': { short: '1Y', spoken: 'Last year' },
  all: { short: 'All', spoken: 'All time' },
};

/** The heaviest set over time, with a range to pick. An exercise not done yet keeps the box, which says so. */
export function ExerciseChart({
  exerciseId,
  done,
  units,
}: {
  exerciseId: string;
  done: boolean;
  units: Units;
}) {
  const { colors, radius, space, text } = useTheme();
  const [range, setRange] = useState<ProgressRange>('3m');
  const [width, setWidth] = useState(0);
  const progress = useExerciseProgress(exerciseId, range, done);
  const points = progress.data?.points ?? [];

  function renderBox() {
    if (!done) {
      return <BoxMessage>No sessions yet</BoxMessage>;
    }
    if (progress.data === undefined) {
      return progress.isLoadingError ? (
        <BoxMessage
          onRetry={() => {
            void progress.refetch();
          }}
        >
          Couldn’t load the chart.
        </BoxMessage>
      ) : (
        <View accessible accessibilityLabel="Loading the chart">
          {width > 0 && <Skeleton width={width} height={chartHeight} />}
        </View>
      );
    }
    if (points.length === 0) {
      return <BoxMessage>No sessions in this period</BoxMessage>;
    }

    return width > 0 && <Chart points={points} width={width} units={units} />;
  }

  return (
    <View style={{ gap: space.sm }}>
      <View style={styles.title}>
        <SectionTitle>Heaviest set</SectionTitle>
        {points.length > 0 && (
          <Text style={[text.chip, { color: colors.primaryText }]}>
            {changeText(points, units)}
          </Text>
        )}
      </View>
      {done && (
        <QuickPicks
          label="Time range"
          values={progressRanges}
          selected={range}
          onSelect={setRange}
          format={(value) => rangeLabels[value].short}
          formatSpoken={(value) => rangeLabels[value].spoken}
        />
      )}
      <View
        testID="exercise-chart"
        onLayout={(event) => {
          setWidth(event.nativeEvent.layout.width - 2 * space.lg);
        }}
        style={[
          styles.box,
          {
            minHeight: chartHeight + space.md + space.sm,
            paddingTop: space.md,
            paddingBottom: space.sm,
            paddingHorizontal: space.lg,
            borderRadius: radius.card,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        {renderBox()}
      </View>
    </View>
  );
}

/** A line inside the chart's box, which already frames it, with Try again after a failure. */
function BoxMessage({
  children,
  onRetry,
}: {
  children: string;
  onRetry?: () => void;
}) {
  const { colors, space, text } = useTheme();

  return (
    <View style={[styles.messageBox, { gap: space.xs }]}>
      <Text
        accessibilityRole={onRetry ? 'alert' : undefined}
        style={[text.body, styles.message, { color: colors.muted }]}
      >
        {children}
      </Text>
      {onRetry && <TextLink label="Try again" onPress={onRetry} />}
    </View>
  );
}

function Chart({
  points,
  width,
  units,
}: {
  points: Point[];
  width: number;
  units: Units;
}) {
  const { colors, text } = useTheme();
  const values = points.map((point) => weightIn(point.weightKg, units));
  const ticks = weightTicks(values);
  const days = points.map((point) => dayNumber(point.date));
  const left = plot.left;
  const right = width - plot.right;
  const bottom = chartHeight - plot.bottom;
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  const xOf = (day: number) =>
    lastDay === firstDay
      ? (left + right) / 2
      : left + ((day - firstDay) / (lastDay - firstDay)) * (right - left);
  const yOf = (value: number) =>
    bottom -
    ((value - ticks[0]) / (ticks[ticks.length - 1] - ticks[0])) *
      (bottom - plot.top);
  const label = [text.meta, styles.label, { color: colors.muted }];
  const line = points
    .map(
      (_, index) => `${String(xOf(days[index]))},${String(yOf(values[index]))}`,
    )
    .join(' ');

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={spokenText(points, units)}
    >
      <Svg width={width} height={chartHeight}>
        {ticks.map((tick) => (
          <Line
            key={`line-${String(tick)}`}
            x1={left}
            x2={right}
            y1={yOf(tick)}
            y2={yOf(tick)}
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        <Polyline
          points={line}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {points.map((point, index) => {
          const last = index === points.length - 1;
          if (!last && points.length > maxDots) {
            return null;
          }

          return (
            <Circle
              key={point.date}
              testID="chart-dot"
              cx={xOf(days[index])}
              cy={yOf(values[index])}
              r={last ? 4.5 : 3}
              fill={last ? colors.primary : colors.card}
              stroke={colors.primary}
              strokeWidth={2}
            />
          );
        })}
      </Svg>
      {ticks.map((tick) => (
        <Text
          key={`tick-${String(tick)}`}
          style={[
            label,
            {
              left: left - 6 - labelWidth,
              top: yOf(tick) - labelHeight / 2,
              textAlign: 'right',
            },
          ]}
        >
          {String(tick)}
        </Text>
      ))}
      {monthLabels(points[0].date, points[points.length - 1].date).map(
        (month) => (
          <Text
            key={month.day}
            style={[
              label,
              {
                left:
                  Math.min(Math.max(xOf(month.day), left + 12), right - 12) -
                  labelWidth / 2,
                top: chartHeight - labelHeight - 4,
                textAlign: 'center',
              },
            ]}
          >
            {month.label}
          </Text>
        ),
      )}
    </View>
  );
}

/** From the first heaviest set to the last, for example "70 → 82.5 kg". */
function changeText(points: Point[], units: Units) {
  const first = points[0];
  const last = points[points.length - 1];

  return points.length === 1
    ? formatWeight(last.weightKg, units)
    : `${String(weightIn(first.weightKg, units))} → ${formatWeight(last.weightKg, units)}`;
}

/** What the chart shows, for screen readers. */
function spokenText(points: Point[], units: Units) {
  const first = points[0];
  const last = points[points.length - 1];

  return points.length === 1
    ? `Heaviest set was ${formatWeight(last.weightKg, units)} on ${formatShortDate(last.date)}`
    : `Heaviest set went from ${formatWeight(first.weightKg, units)} on ${formatShortDate(first.date)} to ${formatWeight(last.weightKg, units)} on ${formatShortDate(last.date)}`;
}

const styles = StyleSheet.create({
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  box: {
    justifyContent: 'center',
    borderWidth: 1,
  },
  messageBox: {
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
  },
  label: {
    position: 'absolute',
    width: labelWidth,
    height: labelHeight,
    fontSize: 11,
    lineHeight: labelHeight,
  },
});
