import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { HeaderIconButton } from '@/components/header-icon-button';
import { CalendarIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { useTheme } from '@/theme/theme-provider';

import { addDays, dateFromText, dateText, dayHeading, weekOf } from './dates';
import { DayCard, DayCardSkeleton } from './day-card';
import { dayKeys } from './query-keys';
import { useDay } from './use-day';
import { useFirstDay } from './use-first-day';
import { WeekPager } from './week-pager';

const weeksAhead = 4;

export function WorkoutScreen() {
  const { colors, size, space } = useTheme();
  const [now, setNow] = useState(() => new Date());
  const today = dateText(now);
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked ?? today;
  const selectedDate = dateFromText(selected);
  const week = weekOf(selectedDate);
  const day = useDay(selected);
  const firstDay = useFirstDay();
  const queryClient = useQueryClient();
  const opened = useRef(false);

  const firstMonday = weekOf(dateFromText(firstDay.data ?? today))[0];
  const lastMonday = addDays(weekOf(now)[0], weeksAhead * 7);
  const canGoBack = addDays(week[0], -7) >= firstMonday;
  const canGoForward = addDays(week[0], 7) <= lastMonday;

  function pick(date: string) {
    setPicked(date === today ? null : date);
  }

  function changeWeek(direction: number) {
    if (direction > 0 ? canGoForward : canGoBack) {
      pick(dateText(addDays(selectedDate, direction * 7)));
    }
  }

  const refresh = useCallback(() => {
    setNow(new Date());
    for (const queryKey of [dayKeys.allDay, dayKeys.allDays, dayKeys.first]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient]);

  // Coming back may find another date, or changes made on other tabs.
  useFocusEffect(
    useCallback(() => {
      if (opened.current) {
        refresh();
      }
      opened.current = true;
    }, [refresh]),
  );

  // The app can stay open past midnight, with this tab showing.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [refresh]);

  function renderContent() {
    if (day.data !== undefined) {
      return <DayCard day={day.data} today={today} />;
    }

    if (day.isError) {
      return (
        <LoadFailure message="Couldn't load this day." onRetry={refresh} />
      );
    }

    return <DayCardSkeleton />;
  }

  const { label, title } = dayHeading(dateFromText(selected), today);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View
        style={{
          gap: space.lg,
          paddingTop: size.topPaddingTab,
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.lg,
        }}
      >
        <View style={[styles.header, { gap: space.md }]}>
          <View style={styles.heading}>
            <ScreenHeading label={label} title={title} />
          </View>
          {selected === today ? (
            <HeaderIconButton
              label="Month"
              onPress={() => {
                notifyFailure('The month view comes in a later update.');
              }}
            >
              <CalendarIcon color={colors.text} />
            </HeaderIconButton>
          ) : (
            <Button
              label="Back to today"
              variant="secondary"
              onPress={() => {
                setPicked(null);
              }}
            />
          )}
        </View>
        <WeekPager
          week={week}
          today={today}
          selected={selected}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onSelect={pick}
          onChangeWeek={changeWeek}
        />
      </View>
      <ScrollView
        contentContainerStyle={{
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heading: {
    flex: 1,
  },
});
