import { Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { LoadFailure } from '@/components/load-failure';
import { Sheet } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { ExerciseTargets } from '@/features/routines/exercise-targets';
import { StatusLabel } from '@/components/status-label';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText, shortWeekdayDate } from './dates';
import { useDay } from './use-day';

type Day = components['schemas']['DayResponse'];

function DayDetails({ day, today }: { day: Day; today: string }) {
  const { colors, space, text } = useTheme();
  const date = shortWeekdayDate(dateFromText(day.date));

  if (day.routine === null) {
    return (
      <View style={{ gap: space.sm }}>
        <StatusLabel label={date} />
        <Text style={text.meta}>
          Nothing planned. Recovery is part of the program.
        </Text>
      </View>
    );
  }

  const status = {
    completed: { label: `Done · ${date}`, color: colors.success },
    inProgress: { label: `In progress · ${date}`, color: colors.primaryText },
    missed: { label: `Missed · ${date}`, color: colors.danger },
    planned: {
      label: `${day.date === today ? 'Today' : 'Planned'} · ${date}`,
      color: colors.muted,
    },
    rest: { label: date, color: undefined },
    skipped: { label: `Skipped · ${date}`, color: colors.skipped },
  }[day.status];

  return (
    <View style={{ gap: space.lg }}>
      <StatusLabel label={status.label} color={status.color} />
      <ExerciseTargets
        exercises={day.routine.exercises}
        background={colors.bg}
      />
    </View>
  );
}

/** A day's summary over the month. It stays filled in while it closes. */
export function DaySheet({
  date,
  visible,
  today,
  onClose,
  onOpenDay,
}: {
  date: string;
  visible: boolean;
  today: string;
  onClose: () => void;
  onOpenDay: () => void;
}) {
  const { space } = useTheme();
  const day = useDay(date);

  function title() {
    if (day.data === undefined) {
      return shortWeekdayDate(dateFromText(date));
    }

    return day.data.routine?.name ?? 'Rest day';
  }

  function renderBody() {
    if (day.data !== undefined) {
      return <DayDetails day={day.data} today={today} />;
    }

    if (day.isError) {
      return (
        <LoadFailure
          message="Couldn't load this day."
          onRetry={() => {
            void day.refetch();
          }}
        />
      );
    }

    return (
      <View style={{ gap: space.lg }}>
        <Skeleton width={200} height={12} />
        <Skeleton width={300} height={56} />
      </View>
    );
  }

  return (
    <Sheet
      visible={visible}
      title={title()}
      onClose={onClose}
      body={renderBody()}
    >
      <Button label="Open day" onPress={onOpenDay} />
    </Sheet>
  );
}
