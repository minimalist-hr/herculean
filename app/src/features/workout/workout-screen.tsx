import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { HeaderIconButton } from '@/components/header-icon-button';
import { CalendarIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { ScreenHeading } from '@/components/screen-heading';
import { useGoBack } from '@/features/home/use-go-back';
import { useTheme } from '@/theme/theme-provider';

import {
  addDays,
  dateFromText,
  dateText,
  weekOf,
  weeksAhead,
} from '@/formats/dates';
import { dayHeading } from '@/formats/formats';
import { DayCard, DayCardSkeleton } from './day-card';
import { useDay } from './use-day';
import { useDayRefresh } from './use-day-refresh';
import { useFirstDay } from './use-first-day';
import { WeekPager } from './week-pager';
import { useFloatingRoom } from '@/components/above-tab-bar';

export function WorkoutScreen({
  openedDate,
  openedFromHome = false,
}: {
  /** The day opened from the month or Home, which this screen then goes back to. */
  openedDate?: string;
  openedFromHome?: boolean;
}) {
  const router = useRouter();
  const goBack = useGoBack(openedFromHome);
  const { colors, size, space } = useTheme();
  const floatingRoom = useFloatingRoom();
  const { now, refresh } = useDayRefresh();
  const today = dateText(now);
  const [picked, setPicked] = useState<string | null>(openedDate ?? null);
  const selected = picked ?? today;
  const selectedDate = dateFromText(selected);
  const week = weekOf(selectedDate);
  const day = useDay(selected);
  const firstDay = useFirstDay();

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

  function renderContent() {
    if (day.data !== undefined) {
      return <DayCard day={day.data} today={today} />;
    }

    if (day.isLoadingError) {
      return (
        <LoadFailure message="Couldn't load this day." onRetry={refresh} />
      );
    }

    return <DayCardSkeleton />;
  }

  const { label, title } = dayHeading(dateFromText(selected), today);

  function renderHeaderAction() {
    if (openedDate !== undefined) {
      return (
        <Button
          label={openedFromHome ? 'Back to Home' : 'Back to month'}
          variant="secondary"
          onPress={goBack}
        />
      );
    }

    if (selected === today) {
      return (
        <HeaderIconButton
          label="Month"
          onPress={() => {
            router.push('/workout/month');
          }}
        >
          <CalendarIcon color={colors.text} />
        </HeaderIconButton>
      );
    }

    return (
      <Button
        label="Back to today"
        variant="secondary"
        onPress={() => {
          setPicked(null);
        }}
      />
    );
  }

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
          {renderHeaderAction()}
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
          paddingBottom: space.xl + floatingRoom,
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
