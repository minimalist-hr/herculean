import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { LoadFailure } from '@/components/load-failure';
import { notifyFailure } from '@/components/notifications';
import { Skeleton } from '@/components/skeleton';
import { SectionTitle } from '@/components/section-title';
import { useTheme } from '@/theme/theme-provider';

import { dayNames, weekdays } from '@/formats/formats';
import { Tappable } from '@/components/tappable';

const mark = 14;

/** The week at a glance: a colored square on a day with a routine, a dash on a rest day. */
export function WeekPlanCard({
  days,
  onRetry,
}: {
  /** Nothing yet while it loads. */
  days?: components['schemas']['WeekPlanDayResponse'][];
  /** Set when the week plan couldn't load. */
  onRetry?: () => void;
}) {
  const { colors, dayColors, radius, space, text } = useTheme();
  const router = useRouter();

  return (
    <View style={{ gap: space.sm }}>
      <View style={styles.title}>
        <SectionTitle>Week plan</SectionTitle>
        <Text style={text.meta}>Repeats every week</Text>
      </View>
      {onRetry === undefined ? (
        renderCard()
      ) : (
        <LoadFailure message="Couldn't load the week plan." onRetry={onRetry} />
      )}
    </View>
  );

  function renderCard() {
    return (
      <View
        accessible={days === undefined}
        accessibilityLabel={
          days === undefined ? 'Loading the week plan' : undefined
        }
        style={[
          styles.card,
          {
            borderRadius: radius.card,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        {weekdays.map((weekday, index) => {
          const day = days?.find((item) => item.weekday === weekday);
          const routineId = day?.routineId ?? null;
          const { full, short } = dayNames[weekday];
          const cellStyle = [
            styles.cell,
            {
              gap: space.sm,
              borderLeftWidth: index === 0 ? 0 : 1,
              borderLeftColor: colors.border,
            },
          ];

          if (days === undefined) {
            return (
              <View key={weekday} style={cellStyle}>
                <Text style={[text.meta, styles.day]}>{short}</Text>
                <Skeleton width={mark} height={mark} />
              </View>
            );
          }

          return (
            <Tappable
              key={weekday}
              accessibilityRole="button"
              accessibilityLabel={`${full}, ${day?.routineName ?? 'rest day'}`}
              onPress={() => {
                if (routineId === null) {
                  notifyFailure(
                    `${full} is a rest day. Edit a routine to pick its days.`,
                  );
                } else {
                  router.push({
                    pathname: '/routines/[id]',
                    params: { id: routineId },
                  });
                }
              }}
              style={cellStyle}
            >
              <Text
                style={[
                  text.meta,
                  styles.day,
                  { color: routineId === null ? colors.muted : colors.text },
                ]}
              >
                {short}
              </Text>
              <View style={styles.mark}>
                {routineId === null ? (
                  <View
                    style={[styles.dash, { backgroundColor: colors.muted }]}
                  />
                ) : (
                  <View
                    style={[
                      styles.mark,
                      {
                        borderRadius: radius.pill,
                        backgroundColor: dayColors[weekday],
                      },
                    ]}
                  />
                )}
              </View>
            </Tappable>
          );
        })}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  day: {
    fontWeight: '600',
  },
  mark: {
    width: mark,
    height: mark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dash: {
    width: 12,
    height: 2,
  },
});
