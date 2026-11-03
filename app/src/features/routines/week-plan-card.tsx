import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { useTheme } from '@/theme/theme-provider';

import { dayNames } from './formats';

/** Each day of the week with its routine or a rest day. */
export function WeekPlanCard({
  days,
}: {
  days: components['schemas']['WeekPlanDayResponse'][];
}) {
  const { colors, radius, space, text } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      <View style={styles.title}>
        <Text style={text.eyebrow}>Week plan</Text>
        <Text style={text.meta}>Repeats every week</Text>
      </View>
      <View
        style={[
          styles.card,
          {
            borderRadius: radius.card,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        {days.map((day, index) => (
          <View
            key={day.weekday}
            style={[
              styles.day,
              {
                gap: space.md,
                minHeight: 52,
                paddingHorizontal: space.lg,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Text style={[text.listItemName, { color: colors.text }]}>
              {dayNames[day.weekday].full}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                text.body,
                styles.dayRoutine,
                {
                  color: day.routineName === null ? colors.muted : colors.text,
                },
              ]}
            >
              {day.routineName ?? 'Rest day'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  day: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayRoutine: {
    flexShrink: 1,
  },
});
