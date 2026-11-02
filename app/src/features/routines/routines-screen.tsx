import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { HeaderIconButton } from '@/components/header-icon-button';
import { ChevronRightIcon, PlusIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { ScreenHeading } from '@/components/screen-heading';
import { Skeleton } from '@/components/skeleton';
import { useTheme } from '@/theme/theme-provider';

import { useRoutines } from './use-routines';
import { useWeekPlan } from './use-week-plan';

type Routine = components['schemas']['RoutineListItemResponse'];
type Weekday = components['schemas']['Weekday'];

const dayNames: Record<Weekday, { full: string; short: string }> = {
  monday: { full: 'Monday', short: 'Mon' },
  tuesday: { full: 'Tuesday', short: 'Tue' },
  wednesday: { full: 'Wednesday', short: 'Wed' },
  thursday: { full: 'Thursday', short: 'Thu' },
  friday: { full: 'Friday', short: 'Fri' },
  saturday: { full: 'Saturday', short: 'Sat' },
  sunday: { full: 'Sunday', short: 'Sun' },
};

function counted(count: number, one: string, many: string) {
  return `${String(count)} ${count === 1 ? one : many}`;
}

export function RoutinesScreen() {
  const { colors, radius, size, space, text } = useTheme();
  const router = useRouter();
  const routines = useRoutines();
  const weekPlan = useWeekPlan();

  function renderRoutine(routine: Routine) {
    const summary = `${counted(routine.exerciseCount, 'exercise', 'exercises')} · ${counted(routine.setCount, 'set', 'sets')}`;
    const days = routine.weekdays
      .map((weekday) => dayNames[weekday].short)
      .join(', ');

    return (
      <Pressable
        key={routine.id}
        accessibilityRole="button"
        accessibilityLabel={`${routine.name}, ${summary}`}
        onPress={() => {
          router.push({
            pathname: '/routine/[id]',
            params: { id: routine.id },
          });
        }}
        style={[
          styles.routine,
          {
            gap: space.md,
            minHeight: size.listRowMin,
            paddingVertical: space.md,
            paddingHorizontal: space.lg,
            borderRadius: radius.card,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        <View style={styles.routineText}>
          <Text style={[text.listItemName, { color: colors.text }]}>
            {routine.name}
          </Text>
          <Text style={text.meta}>{summary}</Text>
        </View>
        {days !== '' && (
          <Text style={[text.chip, { color: colors.primaryText }]}>{days}</Text>
        )}
        <ChevronRightIcon color={colors.muted} size={16} />
      </Pressable>
    );
  }

  function renderContent() {
    if (routines.data !== undefined && weekPlan.data !== undefined) {
      return (
        <>
          <View style={{ gap: space.sm }}>
            <View style={styles.sectionTitle}>
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
              {weekPlan.data.map((day, index) => (
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
                        color:
                          day.routineName === null ? colors.muted : colors.text,
                      },
                    ]}
                  >
                    {day.routineName ?? 'Rest day'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: space.sm }}>
            <Text style={[text.eyebrow, styles.routinesTitle]}>Routines</Text>
            {routines.data.length > 0 ? (
              routines.data.map(renderRoutine)
            ) : (
              <View
                style={[
                  styles.noRoutines,
                  {
                    gap: space.xs,
                    padding: space.xl,
                    borderRadius: radius.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[text.listItemName, { color: colors.text }]}>
                  No routines yet
                </Text>
                <Text style={[text.meta, styles.centered]}>
                  Create a routine, then plan it on the days you train.
                </Text>
              </View>
            )}
          </View>
        </>
      );
    }

    if (routines.isError || weekPlan.isError) {
      return (
        <LoadFailure
          message="Couldn't load your routines."
          onRetry={() => {
            void routines.refetch();
            void weekPlan.refetch();
          }}
        />
      );
    }

    return (
      <View
        accessible
        accessibilityLabel="Loading your routines"
        accessibilityLiveRegion="polite"
        style={{ gap: size.gap.sectionMax }}
      >
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
          {[70, 70, 90, 75, 60, 75, 60].map((width, index) => (
            <View
              key={index}
              style={[
                styles.day,
                {
                  minHeight: 52,
                  paddingHorizontal: space.lg,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <Skeleton width={width} height={14} />
              <Skeleton width={110} height={12} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            gap: space.md,
            paddingTop: size.topPaddingTab,
            paddingHorizontal: size.sidePadding,
            paddingBottom: space.lg,
          },
        ]}
      >
        <View style={styles.heading}>
          <ScreenHeading label="Your training" title="Routines" />
        </View>
        <HeaderIconButton
          label="New routine"
          onPress={() => {
            router.push('/new-routine');
          }}
        >
          <PlusIcon color={colors.text} size={20} />
        </HeaderIconButton>
      </View>
      <ScrollView
        contentContainerStyle={{
          gap: size.gap.sectionMax,
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.xl,
        }}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  heading: {
    flex: 1,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  routinesTitle: {
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
  routine: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  routineText: {
    flex: 1,
    gap: 2,
  },
  noRoutines: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  centered: {
    textAlign: 'center',
  },
});
