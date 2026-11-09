import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BackLink } from '@/components/back-link';
import { Button } from '@/components/button';
import { LoadFailure } from '@/components/load-failure';
import { notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { SectionTitle } from '@/components/section-title';
import { useGoBack } from '@/features/home/use-go-back';
import { useTheme } from '@/theme/theme-provider';

import {
  addMonths,
  dateFromText,
  dateText,
  lastDayReached,
  monthDates,
  monthText,
  weeksAhead,
} from '@/formats/dates';
import { formatShortDate, monthName } from '@/formats/formats';
import { DaySheet } from './day-sheet';
import { MonthCalendar } from './month-calendar';
import { MonthCounts, MonthTotals } from './month-totals';
import { SwipePager } from './swipe-pager';
import { useDayRefresh } from './use-day-refresh';
import { useDays } from './use-days';
import { useFirstDay } from './use-first-day';
import { useMonthSummary } from './use-month-summary';
import { useFloatingRoom } from '@/components/above-tab-bar';

function useMonthDays(month: string) {
  const dates = monthDates(month);

  return useDays(dateText(dates[0]), dateText(dates[dates.length - 1]));
}

function MonthPage({
  month,
  ...calendar
}: Omit<Parameters<typeof MonthCalendar>[0], 'days' | 'failed' | 'onRetry'>) {
  const days = useMonthDays(month);

  return (
    <MonthCalendar
      month={month}
      days={days.data}
      failed={days.isLoadingError}
      onRetry={() => {
        void days.refetch();
      }}
      {...calendar}
    />
  );
}

export function MonthScreen({
  openedFromHome = false,
}: {
  openedFromHome?: boolean;
}) {
  const router = useRouter();
  const goBack = useGoBack(openedFromHome);
  const { colors, size, space } = useTheme();
  const floatingRoom = useFloatingRoom();
  const { now } = useDayRefresh();
  const today = dateText(now);
  const [month, setMonth] = useState(() => monthText(now));
  const [picked, setPicked] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const firstDay = useFirstDay();
  const summary = useMonthSummary(month);

  const selected = picked ?? today;
  const thisMonth = monthText(now);
  const monthStart = dateFromText(`${month}-01`);
  const totalsTitle = `${monthName(monthStart)} totals`;
  const firstDate = firstDay.data ?? today;
  const lastDate = dateText(lastDayReached(now));
  const canGoBack = month > firstDate.slice(0, 7);
  const canGoForward = month < lastDate.slice(0, 7);

  function changeMonth(direction: number) {
    if (direction > 0 ? canGoForward : canGoBack) {
      setMonth(addMonths(month, direction));
    }
  }

  function page(pageMonth: string, hasMonth: boolean) {
    return {
      key: pageMonth,
      content: hasMonth && (
        <MonthPage
          month={pageMonth}
          today={today}
          selected={selected}
          firstDate={firstDate}
          lastDate={lastDate}
          onSelect={(date) => {
            setPicked(date);
            setSheetOpen(true);
          }}
          onChangeMonth={changeMonth}
          onOutOfReach={(date) => {
            notifyFailure(
              date < firstDate
                ? `Your first day is ${formatShortDate(firstDate)}.`
                : `Days reach ${String(weeksAhead)} weeks ahead.`,
            );
          }}
        />
      ),
    };
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        gap: space.lg,
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: space.xl + floatingRoom,
      }}
    >
      <View>
        <BackLink
          label={openedFromHome ? 'Home' : 'Workout'}
          onPress={goBack}
        />
        <View style={[styles.title, { gap: space.md }]}>
          <View style={styles.heading}>
            <ScreenHeading
              title={monthName(monthStart)}
              subtitle={String(monthStart.getFullYear())}
            />
          </View>
          {(month !== thisMonth || selected !== today) && (
            <Button
              label="Back to today"
              variant="secondary"
              onPress={() => {
                setMonth(thisMonth);
                setPicked(null);
              }}
            />
          )}
        </View>
      </View>
      <MonthCounts summary={summary.data} failed={summary.isLoadingError} />
      <SwipePager
        testID="month-calendar"
        previous={page(addMonths(month, -1), canGoBack)}
        current={page(month, true)}
        next={page(addMonths(month, 1), canGoForward)}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onChange={changeMonth}
      />
      {summary.isLoadingError ? (
        <View style={{ gap: space.sm }}>
          <SectionTitle>{totalsTitle}</SectionTitle>
          <LoadFailure
            message="Couldn't load the totals."
            onRetry={() => {
              void summary.refetch();
            }}
          />
        </View>
      ) : (
        <MonthTotals title={totalsTitle} summary={summary.data} />
      )}
      <DaySheet
        date={selected}
        visible={sheetOpen}
        today={today}
        onClose={() => {
          setSheetOpen(false);
        }}
        onViewWorkout={(workoutId) => {
          setSheetOpen(false);
          router.push({
            pathname: '/workout/details/[id]',
            params: { id: workoutId, from: 'month' },
          });
        }}
        onOpenDay={() => {
          setSheetOpen(false);
          router.push({
            pathname: '/workout/day/[date]',
            params: { date: selected },
          });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    flex: 1,
  },
});
