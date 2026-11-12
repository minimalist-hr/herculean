import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/button';
import { FormPage } from '@/components/form-page';
import { Stepper } from '@/components/stepper';
import { SwitchField } from '@/components/switch-field';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { useTheme } from '@/theme/theme-provider';

import { counted, targetText } from '@/formats/formats';
import { useRoutineDraft, type RoutineExerciseDraft } from './routine-draft';
import { supersetBlocked } from './superset-blocks';

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
  const index = exercises.findIndex((item) => item.exerciseId === exerciseId);

  return index === -1 ? null : (
    <Form
      exercise={exercises[index]}
      previous={index > 0 ? exercises[index - 1] : undefined}
      next={exercises.at(index + 1)}
      back={back}
    />
  );
}

function Form({
  exercise,
  previous,
  next,
  back,
}: {
  exercise: RoutineExerciseDraft;
  previous: RoutineExerciseDraft | undefined;
  next: RoutineExerciseDraft | undefined;
  back: string;
}) {
  const { colors, line, space, text } = useTheme();
  const router = useRouter();
  const { setExercises } = useRoutineDraft();
  const [targets, setTargets] = useState({
    targetSets: exercise.targetSets,
    targetRepsFrom: exercise.targetRepsFrom,
    targetRepsTo: exercise.targetRepsTo,
    supersetWithNext: exercise.supersetWithNext,
    lengthenedPartials: exercise.lengthenedPartials,
  });
  const guard = useLeaveGuard(
    targets.targetSets !== exercise.targetSets ||
      targets.targetRepsFrom !== exercise.targetRepsFrom ||
      targets.targetRepsTo !== exercise.targetRepsTo ||
      targets.supersetWithNext !== exercise.supersetWithNext ||
      targets.lengthenedPartials !== exercise.lengthenedPartials,
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
          <View style={{ height: line, backgroundColor: colors.border }} />
          <SwitchField
            label="Lengthened partials"
            hint="After each set, at the stretched end."
            value={targets.lengthenedPartials}
            onChange={(lengthenedPartials) => {
              setTargets({ ...targets, lengthenedPartials });
            }}
          />
          <SwitchField
            label="Superset with next"
            hint={next?.name}
            value={targets.supersetWithNext}
            unavailable={supersetBlocked(previous, next)}
            onChange={(supersetWithNext) => {
              setTargets({ ...targets, supersetWithNext });
            }}
          />
        </View>
      </FormPage>
      {guard.sheet}
    </>
  );
}
