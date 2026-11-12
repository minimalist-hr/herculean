import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { notifyFailure } from '@/components/notifications';
import { Sheet } from '@/components/sheet';
import { useTheme } from '@/theme/theme-provider';

import { useDeleteWorkout } from './use-finish-workout';
import { useFirstDay } from './use-first-day';
import { useSkipWorkout } from './use-skip-workout';
import { useStartWorkout } from './use-start-workout';
import { useUndoSkip } from './use-undo-skip';
import { resumeFirst, useWorkoutInProgress } from './use-workout-in-progress';

export function Actions({ children }: { children: ReactNode[] }) {
  const { space } = useTheme();

  return (
    <View style={[styles.buttons, { gap: space.sm }]}>
      {children.map((button, index) => (
        <View key={index} style={styles.button}>
          {button}
        </View>
      ))}
    </View>
  );
}

/** True while a workout is in progress, which keeps another from starting. */
function useAnotherInProgress() {
  return Boolean(useWorkoutInProgress().data);
}

const startNotYet = 'A workout can’t be started before its day.';

/** The first reason an action can't be used now, or null when it can. */
function firstReason(reasons: [boolean, string][]) {
  return reasons.find(([applies]) => applies)?.[1] ?? null;
}

export function StartButton({
  date,
  label,
  notYet = false,
  confirmMessage,
}: {
  date: string;
  label: string;
  /** The day hasn't come yet. */
  notYet?: boolean;
  /** Asks "Are you ready?" first, with this line under it. */
  confirmMessage?: string;
}) {
  const start = useStartWorkout();
  const [confirming, setConfirming] = useState(false);
  const reason = firstReason([
    [notYet, startNotYet],
    [useAnotherInProgress(), resumeFirst],
  ]);

  return (
    <>
      <Button
        label={label}
        waitingLabel="Starting workout"
        waiting={start.isPending}
        muted={reason !== null}
        onPress={() => {
          if (reason !== null) {
            notifyFailure(reason);
          } else if (confirmMessage === undefined) {
            start.mutate({ date });
          } else {
            setConfirming(true);
          }
        }}
      />
      {confirmMessage !== undefined && (
        <Sheet
          visible={confirming}
          title="Are you ready?"
          message={confirmMessage}
          onClose={() => {
            setConfirming(false);
          }}
        >
          <Button
            label={label}
            waitingLabel="Starting workout"
            waiting={start.isPending}
            onPress={() => {
              start.mutate(
                { date },
                {
                  onSuccess: () => {
                    setConfirming(false);
                  },
                },
              );
            }}
          />
        </Sheet>
      )}
    </>
  );
}

/** Why a workout other than the day's plan can't start on this day, or null when it can. */
function useOtherStartReason(date: string, notYet: boolean) {
  const firstDay = useFirstDay();

  return firstReason([
    [notYet, startNotYet],
    [
      firstDay.data !== undefined && date < firstDay.data,
      'A workout can’t be added before your first day.',
    ],
    [useAnotherInProgress(), resumeFirst],
  ]);
}

/** Asks before starting a workout with no routine. Its exercises are added while logging. */
function EmptyWorkoutSheet({
  date,
  verb,
  replace,
  visible,
  onClose,
}: {
  date: string;
  verb: 'Start' | 'Log';
  replace: boolean;
  visible: boolean;
  onClose: () => void;
}) {
  const start = useStartWorkout({ replace });

  return (
    <Sheet
      visible={visible}
      title={`${verb} an empty workout?`}
      message="Add exercises as you go. Name it when you finish."
      onClose={onClose}
    >
      <Button
        label={`${verb} workout`}
        waitingLabel="Starting workout"
        waiting={start.isPending}
        onPress={() => {
          start.mutate({ date, empty: true });
        }}
      />
    </Sheet>
  );
}

/** Starts a workout with no routine on a day, after asking. Logging takes the page's place when replace is set. */
export function EmptyWorkoutButton({
  date,
  today,
  replace = false,
}: {
  date: string;
  today: string;
  replace?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const reason = useOtherStartReason(date, date > today);
  const verb = date < today ? 'Log' : 'Start';

  return (
    <>
      <Button
        label={`${verb} empty workout`}
        variant="secondary"
        muted={reason !== null}
        onPress={() => {
          if (reason !== null) {
            notifyFailure(reason);
          } else {
            setAsking(true);
          }
        }}
      />
      <EmptyWorkoutSheet
        date={date}
        verb={verb}
        replace={replace}
        visible={asking}
        onClose={() => {
          setAsking(false);
        }}
      />
    </>
  );
}

export function OtherRoutineButton({
  date,
  notYet = false,
}: {
  date: string;
  /** The day hasn't come yet. */
  notYet?: boolean;
}) {
  const router = useRouter();
  const reason = useOtherStartReason(date, notYet);

  return (
    <Button
      label="Other routine"
      variant="secondary"
      muted={reason !== null}
      onPress={() => {
        if (reason !== null) {
          notifyFailure(reason);
        } else {
          router.push({
            pathname: '/workout/choose/[date]',
            params: { date },
          });
        }
      }}
    />
  );
}

export function SkipButton({
  date,
  routineName,
  notYet = false,
}: {
  date: string;
  routineName: string;
  /** The day hasn't come yet. */
  notYet?: boolean;
}) {
  const skip = useSkipWorkout();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button
        label="Skip workout"
        variant="secondary"
        muted={notYet}
        onPress={() => {
          if (notYet) {
            notifyFailure('A workout can’t be skipped before its day.');
          } else {
            setConfirming(true);
          }
        }}
      />
      <Sheet
        visible={confirming}
        title={`Skip ${routineName}?`}
        message="It shows as skipped, and you can undo it."
        onClose={() => {
          setConfirming(false);
        }}
      >
        <Button
          label="Skip workout"
          waitingLabel="Skipping workout"
          waiting={skip.isPending}
          onPress={() => {
            skip.mutate(date);
          }}
        />
      </Sheet>
    </>
  );
}

export function DeleteButton({
  workoutId,
  name,
}: {
  workoutId: string;
  name: string;
}) {
  const remove = useDeleteWorkout(workoutId, name);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button
        label="Delete"
        variant="dangerOutline"
        onPress={() => {
          setConfirming(true);
        }}
      />
      <Sheet
        visible={confirming}
        title={`Delete ${name}?`}
        message="Its sets come out of your history, best sets and month totals. You can undo this right after."
        onClose={() => {
          setConfirming(false);
        }}
      >
        <Button
          label="Delete workout"
          variant="danger"
          waitingLabel="Deleting workout"
          waiting={remove.isPending}
          onPress={() => {
            // On success the day shows its plan, so this card and its sheet go.
            remove.mutate();
          }}
        />
      </Sheet>
    </>
  );
}

export function UndoSkipButton({ workoutId }: { workoutId: string }) {
  const undo = useUndoSkip();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button
        label="Undo skip"
        variant="secondary"
        onPress={() => {
          setConfirming(true);
        }}
      />
      <Sheet
        visible={confirming}
        title="Undo this skip?"
        message="This day goes back to its plan."
        onClose={() => {
          setConfirming(false);
        }}
      >
        <Button
          label="Undo skip"
          waitingLabel="Undoing skip"
          waiting={undo.isPending}
          onPress={() => {
            undo.mutate(workoutId);
          }}
        />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
  },
});
