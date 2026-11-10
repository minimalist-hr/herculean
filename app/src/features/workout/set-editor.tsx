import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { BackspaceIcon, TrashIcon } from '@/components/icons';
import { notifyFailure } from '@/components/notifications';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { FormPage } from '@/components/form-page';
import { Sheet } from '@/components/sheet';
import { Tappable } from '@/components/tappable';
import { formatSet, weightIn, weightUnitOf } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import {
  pressKey,
  problemWith,
  stepOf,
  stepValue,
  toKg,
  type SetField,
} from './set-values';

type WorkoutExercise = components['schemas']['WorkoutExerciseResponse'];
type WorkoutSet = components['schemas']['SetResponse'];
type Units = components['schemas']['Units'];

/** The set a page edits, as it was when the page opened. */
export interface SetEdit {
  exercise: WorkoutExercise;
  set: WorkoutSet;
  index: number;
  field: SetField;
}

/** The set a page opens, or null while it isn't there. */
export function findSetEdit(
  exercises: readonly WorkoutExercise[] | undefined,
  exerciseId: string,
  setId: string,
  field: SetField,
): SetEdit | null {
  const exercise = exercises?.find((item) => item.id === exerciseId);
  const index = exercise?.sets.findIndex((set) => set.id === setId) ?? -1;
  if (exercise === undefined || index === -1) {
    return null;
  }

  return { exercise, set: exercise.sets[index], index, field };
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];

/** A key's height. */
const keyHeight = 52;

const keyLabels: Record<string, string> = {
  '.': 'Decimal point',
  back: 'Delete',
};

function ValueTile({
  label,
  value,
  unit,
  spoken,
  selected,
  onPress,
}: {
  label: string;
  value: string;
  unit?: string;
  spoken: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, radius, space, text } = useTheme();

  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.tile,
        {
          paddingVertical: space.sm,
          paddingHorizontal: space.md,
          borderRadius: radius.control,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.raised : undefined,
        },
      ]}
    >
      <Text style={text.meta}>{label}</Text>
      <Text style={[text.stepperValue, { color: colors.text }]}>
        {value}
        {unit !== undefined && <Text style={text.meta}>{` ${unit}`}</Text>}
      </Text>
    </Tappable>
  );
}

function Keypad({
  field,
  height,
  onPress,
}: {
  field: SetField;
  height: number;
  onPress: (key: string) => void;
}) {
  const { colors, opacity, radius, space, text } = useTheme();

  return (
    <View
      accessibilityLabel="Number keypad"
      style={[styles.keypad, { rowGap: space.xs }]}
    >
      {keys.map((key) => (
        <View key={key} style={styles.keySlot}>
          <Tappable
            accessibilityRole="button"
            accessibilityLabel={keyLabels[key] ?? key}
            onPress={() => {
              onPress(key);
            }}
            style={[
              styles.key,
              {
                height,
                marginHorizontal: space.xs / 2,
                borderRadius: radius.control,
                backgroundColor: colors.raised,
                opacity:
                  key === '.' && field === 'reps' ? opacity.dimmed : undefined,
              },
            ]}
          >
            {key === 'back' ? (
              <BackspaceIcon color={colors.text} size={22} />
            ) : (
              <Text style={[text.stepperValue, { color: colors.text }]}>
                {key}
              </Text>
            )}
          </Tappable>
        </View>
      ))}
    </View>
  );
}

function stepLabel(direction: string, field: SetField, units: Units) {
  const unit = field === 'reps' ? 'rep' : weightUnitOf(units);

  return `${direction} ${String(stepOf(field, units))} ${unit}`;
}

/** The values a set's page saves. A field left out didn't change. */
export interface SetChanges {
  weightKg?: number;
  reps?: number;
}

/** A set's page: last time, the values, steppers, a keypad, the trash and Save set. Where a change goes is up to the screen. */
export function SetEditorPage({
  back,
  edit,
  units,
  saving = false,
  onSave,
  onRemove,
}: {
  /** The screen its back link returns to. */
  back: string;
  edit: SetEdit;
  units: Units;
  saving?: boolean;
  /** Saves the changes. Calling done leaves the page. */
  onSave: (changes: SetChanges, done: () => void) => void;
  onRemove: () => void;
}) {
  const router = useRouter();
  const { colors, opacity, radius, size, space, text } = useTheme();
  const { exercise, set, index } = edit;
  const startWeight = String(weightIn(set.weightKg, units));
  const startReps = String(set.reps);
  const [field, setField] = useState(edit.field);
  const [weight, setWeight] = useState(startWeight);
  const [reps, setReps] = useState(startReps);
  const [fresh, setFresh] = useState(true);
  const changed =
    Number(weight) !== Number(startWeight) ||
    Number(reps) !== Number(startReps);
  const guard = useLeaveGuard(changed);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const value = field === 'weight' ? weight : reps;
  const setValue = field === 'weight' ? setWeight : setReps;
  const problem =
    problemWith(weight, 'weight', units) ?? problemWith(reps, 'reps', units);
  const lastTime = exercise.lastTime?.sets[index];
  const onlySet = exercise.sets.length === 1;

  function pick(next: SetField) {
    setField(next);
    setFresh(true);
  }

  function press(key: string) {
    if (key === '.' && field === 'reps') {
      notifyFailure('Reps are whole numbers.');
      return;
    }

    setValue(pressKey(value, key, { fresh, field, units }));
    setFresh(false);
  }

  function step(direction: 1 | -1) {
    setValue(stepValue(value, direction, field, units));
    setFresh(true);
  }

  function save() {
    if (problem !== null) {
      notifyFailure(problem);
      return;
    }

    // An untouched value isn't sent, so it doesn't count as changed by hand.
    const changes = {
      weightKg:
        Number(weight) === Number(startWeight)
          ? undefined
          : toKg(Number(weight), units),
      reps: Number(reps) === Number(startReps) ? undefined : Number(reps),
    };
    if (changes.weightKg === undefined && changes.reps === undefined) {
      router.back();
      return;
    }

    guard.allow();
    onSave(changes, () => {
      router.back();
    });
  }

  function remove() {
    if (onlySet) {
      notifyFailure(
        'An exercise keeps at least one set. Use the exercise’s trash to remove it.',
      );
      return;
    }

    setConfirmingRemove(true);
  }

  function confirmRemove() {
    setConfirmingRemove(false);
    guard.allow();
    onRemove();
    router.back();
  }

  return (
    <FormPage
      back={back}
      title={`Set ${String(index + 1)}`}
      subtitle={exercise.name}
      action={
        <Button
          label="Save set"
          waitingLabel="Saving set"
          waiting={saving}
          muted={problem !== null}
          onPress={save}
        />
      }
    >
      <View style={{ gap: space.md }}>
        <View style={[styles.lastTime, { gap: space.md }]}>
          <View style={[styles.lastTimeText, { gap: space.sm }]}>
            <Text style={[text.body, { color: colors.muted }]}>Last time</Text>
            <Text style={[text.listItemName, { color: colors.text }]}>
              {lastTime
                ? formatSet(lastTime.weightKg, lastTime.reps, units)
                : '–'}
            </Text>
          </View>
          <Tappable
            accessibilityRole="button"
            accessibilityLabel={`Remove set ${String(index + 1)}`}
            onPress={remove}
            style={[
              styles.trash,
              {
                width: size.touchTargetMin,
                height: size.touchTargetMin,
                borderRadius: radius.control,
                borderColor: colors.border,
                backgroundColor: colors.raised,
                opacity: onlySet ? opacity.dimmed : undefined,
              },
            ]}
          >
            <TrashIcon color={colors.dangerFill} size={20} />
          </Tappable>
        </View>

        <View style={[styles.pair, { gap: space.sm }]}>
          <ValueTile
            label="Weight"
            value={weight === '' ? '0' : weight}
            unit={weightUnitOf(units)}
            spoken={`Weight, ${weight === '' ? '0' : weight} ${units === 'metric' ? 'kilograms' : 'pounds'}`}
            selected={field === 'weight'}
            onPress={() => {
              pick('weight');
            }}
          />
          <ValueTile
            label="Reps"
            value={reps === '' ? '0' : reps}
            spoken={`Reps, ${reps === '' ? '0' : reps}`}
            selected={field === 'reps'}
            onPress={() => {
              pick('reps');
            }}
          />
        </View>

        <View style={[styles.pair, { gap: space.sm }]}>
          {([-1, 1] as const).map((direction) => (
            <View key={direction} style={styles.stepSlot}>
              <Button
                label={stepLabel(direction < 0 ? '−' : '+', field, units)}
                variant="secondary"
                onPress={() => {
                  step(direction);
                }}
              />
            </View>
          ))}
        </View>

        <Keypad field={field} height={keyHeight} onPress={press} />
      </View>
      <Sheet
        visible={confirmingRemove}
        title={`Remove set ${String(index + 1)}?`}
        message={`It comes off ${exercise.name} in this workout.`}
        onClose={() => {
          setConfirmingRemove(false);
        }}
      >
        <Button label="Remove set" variant="danger" onPress={confirmRemove} />
      </Sheet>
      {guard.sheet}
    </FormPage>
  );
}

const styles = StyleSheet.create({
  lastTime: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  lastTimeText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  trash: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pair: {
    flexDirection: 'row',
  },
  tile: {
    flex: 1,
    borderWidth: 1.5,
  },
  stepSlot: {
    flex: 1,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
  keySlot: {
    width: '33.33%',
  },
  key: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
