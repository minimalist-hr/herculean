import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { useTheme } from '@/theme/theme-provider';

import { dateText } from '@/formats/dates';
import { dayNameOf, dayStatusWord } from '@/formats/formats';
import { DayMarker } from './day-marker';
import { Tappable } from '@/components/tappable';

type DaySummary = components['schemas']['DaySummaryResponse'];

function dayLabel(date: Date, day: DaySummary | undefined, isToday: boolean) {
  const parts = [`${dayNameOf(date).full} ${String(date.getDate())}`];
  if (day !== undefined) {
    parts.push(day.routineName ?? 'rest day');
  }
  const word = day && dayStatusWord(day.status);
  if (word) {
    parts.push(word);
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
  onChangeWeek,
}: {
  week: Date[];
  today: string;
  selected: string;
  /** Nothing while it loads, or if it couldn't load: the dates still show. */
  days?: DaySummary[];
  onSelect: (date: string) => void;
  /** 1 is the next week, and -1 the previous. Screen readers can't swipe, so each day offers these. Without it the strip stays on its week. */
  onChangeWeek?: (direction: number) => void;
}) {
  const { colors, radius, space, text } = useTheme();

  return (
    <View
      accessibilityLabel="This week"
      style={[styles.strip, { gap: space.xs }]}
    >
      {week.map((date) => {
        const dateKey = dateText(date);
        const day = days?.find((item) => item.date === dateKey);
        const isToday = dateKey === today;
        const isSelected = dateKey === selected;
        const numberColor = isToday ? colors.primaryText : colors.text;

        return (
          <Tappable
            key={dateKey}
            accessibilityRole="button"
            accessibilityLabel={dayLabel(date, day, isToday)}
            accessibilityState={{ selected: isSelected }}
            accessibilityActions={onChangeWeek && weekActions}
            onAccessibilityAction={({ nativeEvent }) => {
              onChangeWeek?.(nativeEvent.actionName === 'nextWeek' ? 1 : -1);
            }}
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
                text.dayName,
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
            <DayMarker
              date={dateKey}
              status={day?.status ?? 'rest'}
              selected={isSelected}
            />
          </Tappable>
        );
      })}
    </View>
  );
}

const weekActions = [
  { name: 'previousWeek', label: 'Previous week' },
  { name: 'nextWeek', label: 'Next week' },
];

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
});
