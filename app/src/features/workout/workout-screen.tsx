import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { HeaderIconButton } from '@/components/header-icon-button';
import { CalendarIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText, dateText, dayHeading, weekOf } from './dates';
import { DayCard, DayCardSkeleton } from './day-card';
import { useDay } from './use-day';
import { useDays } from './use-days';
import { WeekStrip } from './week-strip';

export function WorkoutScreen() {
  const { colors, size, space } = useTheme();
  const [now, setNow] = useState(() => new Date());
  const today = dateText(now);
  const week = weekOf(now);
  const [picked, setPicked] = useState<string | null>(null);
  // A new week has moved on from a day picked in the last one.
  const selected =
    picked !== null && week.some((date) => dateText(date) === picked)
      ? picked
      : today;
  const day = useDay(selected);
  const days = useDays(dateText(week[0]), dateText(week[6]));
  const { refetch: refetchDay } = day;
  const { refetch: refetchDays } = days;
  const opened = useRef(false);

  // Coming back may find another date, or changes made on other tabs.
  useFocusEffect(
    useCallback(() => {
      if (opened.current) {
        setNow(new Date());
        void refetchDay();
        void refetchDays();
      }
      opened.current = true;
    }, [refetchDay, refetchDays]),
  );

  function renderContent() {
    if (day.data !== undefined) {
      return <DayCard day={day.data} today={today} />;
    }

    if (day.isError) {
      return (
        <LoadFailure
          message="Couldn't load this day."
          onRetry={() => {
            void day.refetch();
            void days.refetch();
          }}
        />
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
        <WeekStrip
          week={week}
          today={today}
          selected={selected}
          days={days.data}
          onSelect={setPicked}
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
