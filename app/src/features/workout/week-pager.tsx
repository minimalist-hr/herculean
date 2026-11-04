import { addDays, dateText, weekOf } from './dates';
import { SwipePager } from './swipe-pager';
import { useDays } from './use-days';
import { WeekStrip } from './week-strip';

interface WeekPagerProps {
  week: Date[];
  today: string;
  selected: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onSelect: (date: string) => void;
  /** 1 is the next week, and -1 the previous. */
  onChangeWeek: (direction: number) => void;
}

/** The week strip, which follows a sideways swipe to the week before or after. */
export function WeekPager({
  week,
  today,
  selected,
  canGoBack,
  canGoForward,
  onSelect,
  onChangeWeek,
}: WeekPagerProps) {
  function page(pageWeek: Date[], hasWeek: boolean) {
    return {
      key: dateText(pageWeek[0]),
      content: hasWeek && (
        <WeekPage
          week={pageWeek}
          today={today}
          selected={selected}
          onSelect={onSelect}
          onChangeWeek={onChangeWeek}
        />
      ),
    };
  }

  return (
    <SwipePager
      testID="week-strip"
      previous={page(weekOf(addDays(week[0], -7)), canGoBack)}
      current={page(week, true)}
      next={page(weekOf(addDays(week[0], 7)), canGoForward)}
      canGoBack={canGoBack}
      canGoForward={canGoForward}
      onChange={onChangeWeek}
    />
  );
}

function WeekPage({
  week,
  today,
  selected,
  onSelect,
  onChangeWeek,
}: {
  week: Date[];
  today: string;
  selected: string;
  onSelect: (date: string) => void;
  onChangeWeek: (direction: number) => void;
}) {
  const days = useDays(dateText(week[0]), dateText(week[6]));

  return (
    <WeekStrip
      week={week}
      today={today}
      selected={selected}
      days={days.data}
      onSelect={onSelect}
      onChangeWeek={onChangeWeek}
    />
  );
}
