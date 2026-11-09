import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { EmptyCard } from '@/components/empty-card';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { PlusIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { dismissNotification } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { SearchField } from '@/components/search-field';
import { useTheme } from '@/theme/theme-provider';

import { counted, dayNames } from '@/formats/formats';
import { RoutineRow, RoutineRowSkeleton } from './routine-row';
import { useRoutines } from './use-routines';
import { useWeekPlan } from './use-week-plan';
import { WeekPlanCard } from './week-plan-card';
import { useFloatingRoom } from '@/components/above-tab-bar';

type Routine = components['schemas']['RoutineListItemResponse'];

export function RoutinesScreen() {
  const { colors, dayColors, size, space, text } = useTheme();
  const floatingRoom = useFloatingRoom();
  const router = useRouter();
  const routines = useRoutines();
  const weekPlan = useWeekPlan();
  const [searchText, setSearchText] = useState('');
  const search = searchText.trim();
  const noRoutines = routines.data?.length === 0;

  function renderRoutine(routine: Routine) {
    return (
      <RoutineRow
        key={routine.id}
        name={routine.name}
        summary={`${counted(routine.exerciseCount, 'exercise', 'exercises')} · ${counted(routine.setCount, 'set', 'sets')}`}
        trailing={
          routine.weekdays.length > 0 && (
            <Text style={[text.chip, { color: colors.muted }]}>
              {routine.weekdays.map((weekday, index) => (
                <Text key={weekday}>
                  {index > 0 && ', '}
                  <Text style={{ color: dayColors[weekday] }}>
                    {dayNames[weekday].short}
                  </Text>
                </Text>
              ))}
            </Text>
          )
        }
        onPress={() => {
          router.push({
            pathname: '/routines/[id]',
            params: { id: routine.id },
          });
        }}
      />
    );
  }

  function renderWeekPlan() {
    if (search !== '' || noRoutines) {
      return null;
    }

    return weekPlan.isLoadingError ? (
      <WeekPlanCard
        onRetry={() => {
          void weekPlan.refetch();
        }}
      />
    ) : (
      <WeekPlanCard days={weekPlan.data} />
    );
  }

  function renderRoutines() {
    if (routines.data !== undefined) {
      if (noRoutines) {
        return (
          <EmptyCard
            title="No routines yet"
            message="Create a routine and pick the days you train."
          />
        );
      }

      const shown = routines.data.filter((routine) =>
        routine.name.toLowerCase().includes(search.toLowerCase()),
      );

      if (shown.length === 0) {
        return (
          <EmptyCard
            title={`No matches for “${search}”`}
            message="Check the spelling, or create it as a new routine."
          />
        );
      }

      return <View style={{ gap: space.sm }}>{shown.map(renderRoutine)}</View>;
    }

    if (routines.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn't load your routines."
          onRetry={() => {
            void routines.refetch();
          }}
        />
      );
    }

    return (
      <View
        accessible
        accessibilityLabel="Loading your routines"
        accessibilityLiveRegion="polite"
        style={{ gap: space.sm }}
      >
        {[120, 100, 130, 90].map((width) => (
          <RoutineRowSkeleton key={width} width={width} />
        ))}
      </View>
    );
  }

  function renderContent() {
    return (
      <View style={{ gap: size.gap.sectionMax }}>
        {renderWeekPlan()}
        {renderRoutines()}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View
        style={{
          gap: space.lg,
          paddingTop: size.topPaddingTab,
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.md,
        }}
      >
        <ScreenHeading
          title="Routines"
          subtitle="The workouts you plan across your week."
        />
        {!noRoutines && (
          <SearchField
            label="Search routines"
            value={searchText}
            onChangeText={(value) => {
              dismissNotification();
              setSearchText(value);
            }}
          />
        )}
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.xl + floatingRoom,
        }}
      >
        {renderContent()}
      </ScrollView>
      <BottomActionBox aboveTabBar>
        <Button
          label="New routine"
          variant="secondary"
          icon={PlusIcon}
          onPress={() => {
            // The list shows whole on the way back, so the new routine is in it.
            setSearchText('');
            router.push({ pathname: '/routine/new', params: { name: search } });
          }}
        />
      </BottomActionBox>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
