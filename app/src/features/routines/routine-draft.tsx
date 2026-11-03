import { createContext, use, useMemo, useState, type ReactNode } from 'react';

export interface Targets {
  targetSets: number;
  targetRepsFrom: number;
  targetRepsTo: number;
}

/** What a newly added exercise starts at. */
export const startingTargets: Targets = {
  targetSets: 3,
  targetRepsFrom: 8,
  targetRepsTo: 10,
};

export interface RoutineExerciseDraft extends Targets {
  exerciseId: string;
  name: string;
}

export interface PickedExercise {
  id: string;
  name: string;
}

interface RoutineDraft {
  exercises: RoutineExerciseDraft[];
  setExercises: React.Dispatch<React.SetStateAction<RoutineExerciseDraft[]>>;
  /** What is picked on Add exercise so far. */
  picked: PickedExercise[];
  setPicked: React.Dispatch<React.SetStateAction<PickedExercise[]>>;
  /** The exercises created while picking, newest last. */
  createdIds: string[];
  setCreatedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const RoutineDraftContext = createContext<RoutineDraft | null>(null);

/** Keeps a routine that is being edited, which several pages work on. Nothing is sent until Save routine. */
export function RoutineDraftProvider({ children }: { children: ReactNode }) {
  const [exercises, setExercises] = useState<RoutineExerciseDraft[]>([]);
  const [picked, setPicked] = useState<PickedExercise[]>([]);
  const [createdIds, setCreatedIds] = useState<string[]>([]);
  const draft = useMemo(
    () => ({
      exercises,
      setExercises,
      picked,
      setPicked,
      createdIds,
      setCreatedIds,
    }),
    [createdIds, exercises, picked],
  );

  return (
    <RoutineDraftContext.Provider value={draft}>
      {children}
    </RoutineDraftContext.Provider>
  );
}

export function useRoutineDraft() {
  const draft = use(RoutineDraftContext);
  if (draft === null) {
    throw new Error('useRoutineDraft needs a RoutineDraftProvider.');
  }

  return draft;
}
