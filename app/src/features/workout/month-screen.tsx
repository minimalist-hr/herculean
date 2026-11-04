import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BackLink } from '@/components/back-link';
import { Button } from '@/components/button';
import { LoadFailure } from '@/components/load-failure';
import { notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { useTheme } from '@/theme/theme-provider';

import {
  addMonths,
  dateFromText,
  dateText,
  lastDayReached,
  monthDates,
  monthName,
  monthText,
  shortDate,
  weeksAhead,
} from './dates';
import { DaySheet } from './day-sheet';
import { MonthCalendar } from './month-calendar';
import { MonthCounts, MonthTotals } from './month-totals';
import { SwipePager } from './swipe-pager';
import { useDayRefresh } from './use-day-refresh';
import { useDays } from './use-days';
import { useFirstDay } from './use-first-day';
import { useMonthSummary } from './use-month-summary';

function useMonthDays(month: string) {
  const dates = monthDates(month);

  return useDays(dateText(dates[0]), dateText(dates[dates.length - 1]));
}

function MonthPage({
  month,
  ...calendar
}: Omit<Parameters<typeof MonthCalendar>[0], 'days'>) {
  const days = useMonthDays(month);

  return <MonthCalendar month={month} days={days.data} {...calendar} />;
}

export function MonthScreen() {
  const router = useRouter();
  const { colors, size, space } = useTheme();
  const { now, refresh } = useDayRefresh();
  const today = dateText(now);
  const [month, setMonth] = useState(() => monthText(now));
  const [picked, setPicked] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const firstDay = useFirstDay();
  const summary = useMonthSummary(month);
  const days = useMonthDays(month);

  const selected = picked ?? today;
  const thisMonth = monthText(now);
  const monthStart = dateFromText(`${month}-01`);
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
                ? `Your first day is ${shortDate(dateFromText(firstDate))}.`
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
        paddingBottom: space.xl,
      }}
    >
      <View>
        <BackLink
          label="Workout"
          onPress={() => {
            router.back();
          }}
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
      {summary.isError || days.isError ? (
        <LoadFailure message="Couldn't load this month." onRetry={refresh} />
      ) : (
        <>
          <MonthCounts summary={summary.data} />
          <SwipePager
            testID="month-calendar"
            previous={page(addMonths(month, -1), canGoBack)}
            current={page(month, true)}
            next={page(addMonths(month, 1), canGoForward)}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onChange={changeMonth}
          />
          <MonthTotals
            title={`${monthName(monthStart)} totals`}
            summary={summary.data}
          />
        </>
      )}
      <DaySheet
        date={selected}
        visible={sheetOpen}
        today={today}
        onClose={() => {
          setSheetOpen(false);
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
