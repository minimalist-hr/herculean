import type { Href } from 'expo-router';
import { createContext, use, useMemo, useState, type ReactNode } from 'react';

import type { PickedExercise } from '@/features/exercises/exercise-picker';

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
  groupId: string;
  groupName: string;
  /** Done as a superset with the exercise after it. */
  supersetWithNext: boolean;
}

interface RoutineDraftPages {
  addExercise: Href;
  targets: (exerciseId: string) => Href;
  newExercise: (params: { name: string; groupId: string }) => Href;
}

/** The pages of a new routine, or of the routine with this ID. */
function pagesOf(routineId: string | undefined): RoutineDraftPages {
  if (routineId === undefined) {
    return {
      addExercise: '/routine/new/add-exercise',
      targets: (exerciseId) => ({
        pathname: '/routine/new/targets',
        params: { exerciseId },
      }),
      newExercise: (params) => ({
        pathname: '/routine/new/new-exercise',
        params,
      }),
    };
  }

  return {
    addExercise: {
      pathname: '/routine/[id]/edit/add-exercise',
      params: { id: routineId },
    },
    targets: (exerciseId) => ({
      pathname: '/routine/[id]/edit/targets',
      params: { id: routineId, exerciseId },
    }),
    newExercise: (params) => ({
      pathname: '/routine/[id]/edit/new-exercise',
      params: { id: routineId, ...params },
    }),
  };
}

interface RoutineDraft {
  /** Where the draft's pages live. */
  pages: RoutineDraftPages;
  exercises: RoutineExerciseDraft[];
  /** Whether the exercises differ from what the draft started with. */
  changed: boolean;
  setExercises: React.Dispatch<React.SetStateAction<RoutineExerciseDraft[]>>;
  /** What is picked on Add exercise so far. */
  picked: PickedExercise[];
  setPicked: React.Dispatch<React.SetStateAction<PickedExercise[]>>;
  /** The exercises created while picking, newest last. */
  createdIds: string[];
  setCreatedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const noExercises: RoutineExerciseDraft[] = [];

const RoutineDraftContext = createContext<RoutineDraft | null>(null);

/** Keeps a routine that is being edited, which several pages work on. Nothing is sent until Save routine. */
export function RoutineDraftProvider({
  routineId,
  initialExercises = noExercises,
  children,
}: {
  /** The routine being edited. A new routine has none. */
  routineId?: string;
  initialExercises?: RoutineExerciseDraft[];
  children: ReactNode;
}) {
  const [exercises, setExercises] = useState(initialExercises);
  const [startedWith] = useState(initialExercises);
  const [picked, setPicked] = useState<PickedExercise[]>([]);
  const [createdIds, setCreatedIds] = useState<string[]>([]);
  const draft = useMemo(
    () => ({
      pages: pagesOf(routineId),
      exercises,
      changed: JSON.stringify(exercises) !== JSON.stringify(startedWith),
      setExercises,
      picked,
      setPicked,
      createdIds,
      setCreatedIds,
    }),
    [createdIds, exercises, picked, routineId, startedWith],
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
