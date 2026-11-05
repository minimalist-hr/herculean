import { NewExerciseToPickScreen } from '@/features/exercises/new-exercise-to-pick-screen';

import { useRoutineDraft } from './routine-draft';

/** Creates an exercise from Add exercise, and comes back with it picked. */
export function NewExerciseForRoutineScreen() {
  const { setPicked, setCreatedIds } = useRoutineDraft();

  return (
    <NewExerciseToPickScreen
      setPicked={setPicked}
      setCreatedIds={setCreatedIds}
    />
  );
}
