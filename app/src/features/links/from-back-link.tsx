import { useRouter } from 'expo-router';

import { BackLink } from '@/components/back-link';
import { useExercise } from '@/features/exercises/use-exercise';
import { useGroup } from '@/features/exercises/use-group';
import { useGoBack } from '@/features/home/use-go-back';
import { useRoutine } from '@/features/routines/use-routine';

/** Pages named by a fixed word, for the back link. */
const fixedNames: Record<string, string | undefined> = {
  day: 'Workout',
  month: 'Month',
  logging: 'Logging',
  workout: 'Workout',
};

/**
 * The back link of a page opened from a row elsewhere. `from` is what the page before it passed,
 * for example "routine:<id>". A name is read from that page's own data, so a rename on the way
 * shows on the way back.
 */
export function FromBackLink({
  from,
  fallback,
}: {
  from?: string;
  /** The label when nothing opened it from elsewhere. */
  fallback: string;
}) {
  const [kind, id = ''] = (from ?? '').split(':');

  if (kind === 'home') {
    return <HomeBackLink />;
  }
  if (id !== '' && kind === 'group') {
    return <GroupBackLink id={id} />;
  }
  if (id !== '' && kind === 'routine') {
    return <RoutineBackLink id={id} />;
  }
  if (id !== '' && kind === 'exercise') {
    return <ExerciseBackLink id={id} />;
  }

  return <PlainBackLink label={fixedNames[kind] ?? fallback} />;
}

function PlainBackLink({ label }: { label: string }) {
  const router = useRouter();

  return (
    <BackLink
      label={label}
      onPress={() => {
        router.back();
      }}
    />
  );
}

function HomeBackLink() {
  const goBack = useGoBack(true);

  return <BackLink label="Home" onPress={goBack} />;
}

function GroupBackLink({ id }: { id: string }) {
  return <PlainBackLink label={useGroup(id).data?.name ?? 'Group'} />;
}

function RoutineBackLink({ id }: { id: string }) {
  return <PlainBackLink label={useRoutine(id).data?.name ?? 'Routine'} />;
}

function ExerciseBackLink({ id }: { id: string }) {
  return <PlainBackLink label={useExercise(id).data?.name ?? 'Exercise'} />;
}
