import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { Tappable } from '@/components/tappable';
import { dayNames, weekdays } from '@/features/routines/formats';
import { useTheme } from '@/theme/theme-provider';

import { dateText, monthDates, monthName, monthTitle } from './dates';
import { DayMarker, MarkerBar } from './day-marker';

type DaySummary = components['schemas']['DaySummaryResponse'];

const daysInWeek = 7;
/** The most weeks a month touches. Every month takes this many, so it doesn't move what is below it. */
const weeksShown = 6;

function dayLabel(date: Date, day: DaySummary | undefined, today: string) {
  const parts = [`${String(date.getDate())} ${monthName(date)}`];
  if (day !== undefined) {
    parts.push(day.routineName ?? 'rest day');
  }
  if (day?.status === 'missed' || day?.status === 'skipped') {
    parts.push(day.status);
  }
  if (dateText(date) === today) {
    parts.push('today');
  } else if (day?.status === 'planned') {
    parts.push('planned');
  }

  return parts.join(', ');
}

/** The month's weeks from Monday. Days of other months, and weeks it doesn't reach, are left empty. */
function weeksOf(month: string) {
  const dates = monthDates(month);
  const leading = (dates[0].getDay() + 6) % daysInWeek;
  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...dates,
  ];
  while (cells.length < weeksShown * daysInWeek) {
    cells.push(null);
  }

  return Array.from({ length: weeksShown }, (_, week) =>
    cells.slice(week * daysInWeek, (week + 1) * daysInWeek),
  );
}

/** A month of days, with a legend. As in the week strip, the selected day is filled in, and today is outlined when another day is selected. Days out of reach look muted, and tapping one says why. */
export function MonthCalendar({
  month,
  today,
  selected,
  firstDate,
  lastDate,
  days,
  onSelect,
  onChangeMonth,
  onOutOfReach,
}: {
  month: string;
  today: string;
  selected: string;
  firstDate: string;
  lastDate: string;
  /** Nothing while it loads: the dates still show. */
  days?: DaySummary[];
  onSelect: (date: string) => void;
  /** 1 is the next month, and -1 the previous. Screen readers can't swipe, so each day offers these. */
  onChangeMonth: (direction: number) => void;
  onOutOfReach: (date: string) => void;
}) {
  const { colors, opacity, radius, space, text } = useTheme();
  const legend = [
    { label: 'Done', color: colors.success },
    { label: 'Missed', color: colors.danger },
    { label: 'Skipped', color: colors.skipped },
    { label: 'Planned', color: colors.muted },
    // A rest day has no marker, so its place stays empty.
    { label: 'Rest', color: 'transparent' },
    ...(days?.some((day) => day.status === 'inProgress')
      ? [{ label: 'In progress', color: colors.primaryText }]
      : []),
  ];

  return (
    <View
      accessibilityLabel={monthTitle(month)}
      style={[
        styles.card,
        {
          gap: space.xs,
          paddingVertical: space.md,
          paddingHorizontal: space.sm,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View style={[styles.row, { gap: space.xs }]}>
        {weekdays.map((weekday) => (
          <Text
            key={weekday}
            style={[text.dayName, styles.weekday, styles.cell]}
          >
            {dayNames[weekday].short}
          </Text>
        ))}
      </View>
      {weeksOf(month).map((week, index) => (
        <View
          key={index}
          testID="calendar-week"
          style={[styles.row, { gap: space.xs }]}
        >
          {week.map((date, cell) => {
            if (date === null) {
              return <View key={cell} style={[styles.cell, styles.emptyDay]} />;
            }

            const dateKey = dateText(date);
            const day = days?.find((item) => item.date === dateKey);
            const isSelected = dateKey === selected;
            const isToday = dateKey === today;
            const inReach = dateKey >= firstDate && dateKey <= lastDate;
            const numberColor = isToday ? colors.primaryText : colors.text;

            return (
              <Tappable
                key={cell}
                accessibilityRole="button"
                accessibilityLabel={dayLabel(date, day, today)}
                accessibilityState={{
                  selected: isSelected,
                  disabled: !inReach,
                }}
                accessibilityActions={monthActions}
                onAccessibilityAction={({ nativeEvent }) => {
                  onChangeMonth(
                    nativeEvent.actionName === 'nextMonth' ? 1 : -1,
                  );
                }}
                onPress={() => {
                  if (inReach) {
                    onSelect(dateKey);
                  } else {
                    onOutOfReach(dateKey);
                  }
                }}
                style={[
                  styles.cell,
                  styles.day,
                  {
                    gap: space.xs,
                    borderRadius: radius.control,
                    borderColor:
                      isSelected || isToday ? colors.primary : colors.border,
                    backgroundColor: isSelected
                      ? colors.primary
                      : 'transparent',
                    opacity: inReach ? 1 : opacity.dimmed,
                  },
                ]}
              >
                <Text
                  style={[
                    text.listItemName,
                    { color: isSelected ? colors.onPrimary : numberColor },
                  ]}
                >
                  {date.getDate()}
                </Text>
                <DayMarker
                  date={dateKey}
                  status={inReach ? (day?.status ?? 'rest') : 'rest'}
                  selected={isSelected}
                />
              </Tappable>
            );
          })}
        </View>
      ))}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.legend,
          {
            marginTop: space.sm,
            marginHorizontal: -space.sm,
            paddingTop: space.md,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.legendGrid, { rowGap: space.sm }]}>
          {legend.map((item) => (
            <View
              key={item.label}
              style={[styles.legendItem, { gap: space.sm }]}
            >
              <MarkerBar color={item.color} />
              <Text style={text.meta}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const monthActions = [
  { name: 'previousMonth', label: 'Previous month' },
  { name: 'nextMonth', label: 'Next month' },
];

/** Fits the longest label, and three of them fit the smallest phone. */
const legendColumnWidth = 94;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
  },
  weekday: {
    textAlign: 'center',
  },
  emptyDay: {
    height: 48,
  },
  day: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  legend: {
    alignItems: 'center',
    borderTopWidth: 1,
  },
  legendGrid: {
    width: legendColumnWidth * 3,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    width: legendColumnWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
