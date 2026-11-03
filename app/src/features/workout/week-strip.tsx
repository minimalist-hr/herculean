import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { useTheme } from '@/theme/theme-provider';

import { dateText, dayNameOf } from './dates';

type DaySummary = components['schemas']['DaySummaryResponse'];

function dayLabel(date: Date, day: DaySummary | undefined, isToday: boolean) {
  const parts = [`${dayNameOf(date).full} ${String(date.getDate())}`];
  if (day !== undefined) {
    parts.push(day.routineName ?? 'rest day');
  }
  if (day?.status === 'missed') {
    parts.push('missed');
  }
  if (isToday) {
    parts.push('today');
  }

  return parts.join(', ');
}

/** A week from Monday, with today filled in. A marker means a workout belongs on that day, and its color says how it went. A rest day has none. */
export function WeekStrip({
  week,
  today,
  days,
}: {
  week: Date[];
  today: string;
  /** Nothing while it loads, or if it couldn't load: the dates still show. */
  days?: DaySummary[];
}) {
  const { colors, radius, space, text } = useTheme();

  return (
    <View accessibilityLabel="This week" style={[styles.strip, { gap: 6 }]}>
      {week.map((date) => {
        const dateKey = dateText(date);
        const day = days?.find((item) => item.date === dateKey);
        const isToday = dateKey === today;
        const markerColor = {
          missed: colors.danger,
          planned: isToday ? colors.onPrimary : colors.muted,
          rest: 'transparent',
        }[day?.status ?? 'rest'];

        return (
          <View
            key={dateKey}
            accessible
            accessibilityLabel={dayLabel(date, day, isToday)}
            style={[
              styles.day,
              {
                gap: space.xs,
                borderRadius: radius.control,
                borderColor: isToday ? colors.primary : colors.border,
                backgroundColor: isToday ? colors.primary : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                text.eyebrow,
                styles.weekday,
                { color: isToday ? colors.onPrimary : colors.muted },
              ]}
            >
              {dayNameOf(date).short}
            </Text>
            <Text
              style={[
                text.statValue,
                { color: isToday ? colors.onPrimary : colors.text },
              ]}
            >
              {date.getDate()}
            </Text>
            <View
              testID={`marker-${dateKey}`}
              style={[styles.marker, { backgroundColor: markerColor }]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
  },
  day: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  weekday: {
    fontSize: 11,
  },
  marker: {
    width: 10,
    height: 2,
  },
});
