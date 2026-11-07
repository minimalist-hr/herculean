import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/button';
import { FormPage } from '@/components/form-page';
import { Stepper } from '@/components/stepper';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { useTheme } from '@/theme/theme-provider';

import { counted, targetText } from './formats';
import {
  useRoutineDraft,
  type RoutineExerciseDraft,
  type Targets,
} from './routine-draft';

const maxSets = 20;
const maxReps = 100;

interface TargetsScreenProps {
  exerciseId: string;
  /** The screen its back link returns to. */
  back: string;
}

/** Sets and a rep range for an exercise in a routine. */
export function TargetsScreen({ exerciseId, back }: TargetsScreenProps) {
  const { exercises } = useRoutineDraft();
  const exercise = exercises.find((item) => item.exerciseId === exerciseId);

  return exercise === undefined ? null : (
    <Form exercise={exercise} back={back} />
  );
}

function Form({
  exercise,
  back,
}: {
  exercise: RoutineExerciseDraft;
  back: string;
}) {
  const { space, text } = useTheme();
  const router = useRouter();
  const { setExercises } = useRoutineDraft();
  const [targets, setTargets] = useState<Targets>({
    targetSets: exercise.targetSets,
    targetRepsFrom: exercise.targetRepsFrom,
    targetRepsTo: exercise.targetRepsTo,
  });
  const guard = useLeaveGuard(
    targets.targetSets !== exercise.targetSets ||
      targets.targetRepsFrom !== exercise.targetRepsFrom ||
      targets.targetRepsTo !== exercise.targetRepsTo,
  );

  return (
    <>
      <FormPage
        back={back}
        title={exercise.name}
        subtitle="Sets and reps for this routine."
        action={
          <Button
            label="Save targets"
            onPress={() => {
              setExercises((current) =>
                current.map((item) =>
                  item.exerciseId === exercise.exerciseId
                    ? { ...item, ...targets }
                    : item,
                ),
              );
              guard.leave(() => {
                router.back();
              });
            }}
          />
        }
      >
        <View style={{ gap: space.lg }}>
          <View style={{ gap: space.sm }}>
            <Text style={text.eyebrow}>Sets</Text>
            <Stepper
              label="Sets"
              value={targets.targetSets}
              onChange={(targetSets) => {
                setTargets({ ...targets, targetSets });
              }}
              min={1}
              max={maxSets}
              step={1}
              format={String}
              formatSpoken={(value) => `${String(value)} sets`}
              formatLimit={(value) => counted(value, 'set', 'sets')}
              lessLabel="One set less"
              moreLabel="One set more"
            />
          </View>
          <View style={{ gap: space.sm }}>
            <Text style={text.eyebrow}>Reps from</Text>
            <Stepper
              label="Reps from"
              value={targets.targetRepsFrom}
              onChange={(targetRepsFrom) => {
                // The high end moves along, so the range always holds.
                setTargets({
                  ...targets,
                  targetRepsFrom,
                  targetRepsTo: Math.max(targets.targetRepsTo, targetRepsFrom),
                });
              }}
              min={1}
              max={maxReps}
              step={1}
              format={String}
              formatSpoken={(value) => `${String(value)} reps`}
              formatLimit={(value) => counted(value, 'rep', 'reps')}
              lessLabel="One rep less from"
              moreLabel="One rep more from"
            />
          </View>
          <View style={{ gap: space.sm }}>
            <Text style={text.eyebrow}>Reps to</Text>
            <Stepper
              label="Reps to"
              value={targets.targetRepsTo}
              onChange={(targetRepsTo) => {
                // The low end moves along, so the range always holds.
                setTargets({
                  ...targets,
                  targetRepsTo,
                  targetRepsFrom: Math.min(
                    targets.targetRepsFrom,
                    targetRepsTo,
                  ),
                });
              }}
              min={1}
              max={maxReps}
              step={1}
              format={String}
              formatSpoken={(value) => `${String(value)} reps`}
              formatLimit={(value) => counted(value, 'rep', 'reps')}
              lessLabel="One rep less to"
              moreLabel="One rep more to"
            />
          </View>
          <Text style={text.meta}>
            {`Logging shows this as ${targetText(targets)}. Use the same number twice for a fixed rep count.`}
          </Text>
        </View>
      </FormPage>
      {guard.sheet}
    </>
  );
}
