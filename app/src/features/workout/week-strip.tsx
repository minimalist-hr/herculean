import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { useTheme } from '@/theme/theme-provider';

import { dateText, dayNameOf } from './dates';

type DaySummary = components['schemas']['DaySummaryResponse'];

function dayLabel(date: Date, day: DaySummary | undefined, isToday: boolean) {
  const parts = [`${dayNameOf(date).full} ${String(date.getDate())}`];
  if (day !== undefined) {
    parts.push(day.routineName ?? 'rest day');
  }
  if (day?.status === 'missed' || day?.status === 'skipped') {
    parts.push(day.status);
  }
  if (isToday) {
    parts.push('today');
  }

  return parts.join(', ');
}

/** A week from Monday. The selected day is filled in, and today is outlined when another day is selected. A marker means a workout belongs on that day, and its color says how it went. A rest day has none. */
export function WeekStrip({
  week,
  today,
  selected,
  days,
  onSelect,
}: {
  week: Date[];
  today: string;
  selected: string;
  /** Nothing while it loads, or if it couldn't load: the dates still show. */
  days?: DaySummary[];
  onSelect: (date: string) => void;
}) {
  const { colors, radius, space, text } = useTheme();

  return (
    <View accessibilityLabel="This week" style={[styles.strip, { gap: 6 }]}>
      {week.map((date) => {
        const dateKey = dateText(date);
        const day = days?.find((item) => item.date === dateKey);
        const isToday = dateKey === today;
        const isSelected = dateKey === selected;
        const markerColor = {
          missed: isSelected ? colors.onPrimary : colors.danger,
          planned: isSelected ? colors.onPrimary : colors.muted,
          rest: 'transparent',
          skipped: isSelected ? colors.onPrimary : colors.skipped,
        }[day?.status ?? 'rest'];
        const numberColor = isToday ? colors.primaryText : colors.text;

        return (
          <Pressable
            key={dateKey}
            accessibilityRole="button"
            accessibilityLabel={dayLabel(date, day, isToday)}
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              onSelect(dateKey);
            }}
            style={[
              styles.day,
              {
                gap: space.xs,
                borderRadius: radius.control,
                borderColor:
                  isSelected || isToday ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primary : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                text.eyebrow,
                styles.weekday,
                { color: isSelected ? colors.onPrimary : colors.muted },
              ]}
            >
              {dayNameOf(date).short}
            </Text>
            <Text
              style={[
                text.statValue,
                { color: isSelected ? colors.onPrimary : numberColor },
              ]}
            >
              {date.getDate()}
            </Text>
            <View
              testID={`marker-${dateKey}`}
              style={[styles.marker, { backgroundColor: markerColor }]}
            />
          </Pressable>
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
