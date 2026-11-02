import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Sheet } from '@/components/sheet';
import { Stepper } from '@/components/stepper';
import { useTheme } from '@/theme/theme-provider';

import { targetText } from './formats';

const maxSets = 20;
const maxReps = 100;

export interface Targets {
  targetSets: number;
  targetRepsFrom: number;
  targetRepsTo: number;
}

interface TargetsSheetProps {
  visible: boolean;
  name: string;
  initial: Targets;
  onSave: (targets: Targets) => void;
  onClose: () => void;
}

/** Sets and a rep range for an exercise in a routine. */
export function TargetsSheet({
  visible,
  name,
  initial,
  onSave,
  onClose,
}: TargetsSheetProps) {
  const { space, text } = useTheme();
  const [targets, setTargets] = useState<Targets>({
    targetSets: initial.targetSets,
    targetRepsFrom: initial.targetRepsFrom,
    targetRepsTo: initial.targetRepsTo,
  });

  return (
    <Sheet
      visible={visible}
      title={name}
      message="Sets and reps for this routine"
      onClose={onClose}
      body={
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
              lessLabel="One rep less to"
              moreLabel="One rep more to"
            />
          </View>
          <Text style={text.meta}>
            {`Logging shows this as ${targetText(targets)}. Use the same number twice for a fixed rep count.`}
          </Text>
        </View>
      }
    >
      <Button
        label="Save targets"
        onPress={() => {
          onSave(targets);
        }}
      />
      <Button label="Cancel" variant="secondary" onPress={onClose} />
    </Sheet>
  );
}
