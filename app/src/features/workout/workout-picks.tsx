import { createContext, use, useMemo, useState, type ReactNode } from 'react';

import type { PickedExercise } from '@/features/exercises/exercise-picker';

function usePicksState() {
  const [picked, setPicked] = useState<PickedExercise[]>([]);
  const [createdIds, setCreatedIds] = useState<string[]>([]);

  return useMemo(
    () => ({ picked, setPicked, createdIds, setCreatedIds }),
    [createdIds, picked],
  );
}

const WorkoutPicksContext = createContext<ReturnType<
  typeof usePicksState
> | null>(null);

/** What is picked for a workout so far, which Add exercise and New exercise both work on. */
export function WorkoutPicksProvider({ children }: { children: ReactNode }) {
  const picks = usePicksState();

  return (
    <WorkoutPicksContext.Provider value={picks}>
      {children}
    </WorkoutPicksContext.Provider>
  );
}

export function useWorkoutPicks() {
  const picks = use(WorkoutPicksContext);
  if (picks === null) {
    throw new Error('useWorkoutPicks needs a WorkoutPicksProvider.');
  }

  return picks;
}
