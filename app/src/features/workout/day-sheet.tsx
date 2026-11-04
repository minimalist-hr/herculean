import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { LoadFailure } from '@/components/load-failure';
import { Sheet } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { ExerciseTargets } from '@/features/routines/exercise-targets';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText, longDate } from './dates';
import { useDay } from './use-day';

type Day = components['schemas']['DayResponse'];

function StatusLine({ label, color }: { label: string; color?: string }) {
  const { radius, space, text } = useTheme();

  return (
    <View style={[styles.status, { gap: space.sm }]}>
      {color !== undefined && (
        <View
          style={[
            styles.dot,
            { borderRadius: radius.check, backgroundColor: color },
          ]}
        />
      )}
      <Text style={[text.eyebrow, color !== undefined && { color }]}>
        {label}
      </Text>
    </View>
  );
}

function DayDetails({ day, today }: { day: Day; today: string }) {
  const { colors, space, text } = useTheme();
  const date = longDate(dateFromText(day.date));

  if (day.routine === null) {
    return (
      <View style={{ gap: space.sm }}>
        <StatusLine label={date} />
        <Text style={text.meta}>
          Nothing planned. Recovery is part of the program.
        </Text>
      </View>
    );
  }

  const status = {
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
      <StatusLine label={status.label} color={status.color} />
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
      return longDate(dateFromText(date));
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

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
  },
});
