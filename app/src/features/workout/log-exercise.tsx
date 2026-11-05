import { useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import {
  CheckIcon,
  OpenOutIcon,
  ChevronRightIcon,
  PlusIcon,
  SwapIcon,
  TrashIcon,
} from '@/components/icons';
import { joinedCardStyle } from '@/components/joined-cards';
import { notifyFailure } from '@/components/notifications';
import { SectionTitle } from '@/components/section-title';
import { Tappable } from '@/components/tappable';
import {
  ExerciseTargetLine,
  ExerciseTargetText,
} from '@/features/routines/exercise-targets';
import { formatLastTime, weightIn, weightUnitOf } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { maxSetsPerExercise, type SetField } from './set-values';
import { checkedSets } from './workout-progress';

type WorkoutExercise = components['schemas']['WorkoutExerciseResponse'];
type WorkoutSet = components['schemas']['SetResponse'];
type Units = components['schemas']['Units'];

/** A checked row's tint: the accent at 16%, as a hex alpha. */
const checkedRowAlpha = '29';

/** A closed exercise: its targets and progress. Tapping it opens it. */
export function ClosedExercise({
  exercise,
  withPrevious,
  withNext,
  onOpen,
}: {
  exercise: WorkoutExercise;
  withPrevious: boolean;
  withNext: boolean;
  onOpen: () => void;
}) {
  const { colors, radius, size, space, text } = useTheme();

  return (
    <Tappable
      feedback="fill"
      accessibilityRole="button"
      accessibilityLabel={`Open ${exercise.name}`}
      onPress={onOpen}
      style={[
        styles.closed,
        {
          gap: space.md,
          minHeight: size.listRowMin,
          paddingVertical: space.sm,
          paddingHorizontal: space.lg,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        joinedCardStyle({
          withPrevious,
          withNext,
          gap: space.sm,
          radius: radius.card,
        }),
      ]}
    >
      <ExerciseTargetText exercise={exercise} />
      <Text style={text.meta}>
        {`${String(checkedSets(exercise))}/${String(exercise.sets.length)}`}
      </Text>
      <ChevronRightIcon color={colors.muted} size={16} />
    </Tappable>
  );
}

function ExerciseAction({
  label,
  muted = false,
  onPress,
  children,
}: {
  label: string;
  /** It isn't available now, but a press can say why. */
  muted?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const { opacity, size } = useTheme();

  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.action,
        {
          width: size.touchTargetMin,
          height: size.touchTargetMin,
          opacity: muted ? opacity.dimmed : undefined,
        },
      ]}
    >
      {children}
    </Tappable>
  );
}

function ValueCell({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  const { colors, radius, size, text } = useTheme();

  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.value,
        styles.valueWidth,
        {
          height: size.touchTargetMin,
          borderRadius: radius.control,
          borderColor: colors.border,
          backgroundColor: colors.raised,
        },
      ]}
    >
      <Text style={[text.listItemName, { color: colors.text }]}>{value}</Text>
    </Tappable>
  );
}

function SetRow({
  exercise,
  set,
  index,
  units,
  onEdit,
  onToggle,
}: {
  exercise: WorkoutExercise;
  set: WorkoutSet;
  index: number;
  units: Units;
  onEdit: (set: WorkoutSet, field: SetField) => void;
  onToggle: (set: WorkoutSet) => void;
}) {
  const { colors, radius, size, space, text } = useTheme();
  const number = String(index + 1);
  const lastTime = exercise.lastTime?.sets[index];
  const weight = String(weightIn(set.weightKg, units));

  return (
    <View
      style={[
        styles.row,
        {
          gap: space.xs,
          marginHorizontal: -space.sm,
          paddingVertical: 2,
          paddingHorizontal: space.sm,
          borderRadius: radius.control,
          backgroundColor: set.checked
            ? `${colors.primary}${checkedRowAlpha}`
            : undefined,
        },
      ]}
    >
      {/* The whole row is a bigger target for sighted use. Screen readers get the two values. */}
      <Tappable
        accessible={false}
        testID={`set-row-${number}`}
        onPress={() => {
          onEdit(set, 'weight');
        }}
        style={[styles.row, styles.rowBody, { gap: space.xs }]}
      >
        <Text
          style={[text.listItemName, styles.number, { color: colors.text }]}
        >
          {number}
        </Text>
        <Text
          numberOfLines={1}
          style={[text.meta, styles.lastTime, !lastTime && styles.noLastTime]}
        >
          {lastTime
            ? formatLastTime(lastTime.weightKg, lastTime.reps, units)
            : '–'}
        </Text>
        <ValueCell
          label={`Set ${number} weight, ${weight} ${units === 'metric' ? 'kilograms' : 'pounds'}`}
          value={weight}
          onPress={() => {
            onEdit(set, 'weight');
          }}
        />
        <ValueCell
          label={`Set ${number} reps, ${String(set.reps)}`}
          value={String(set.reps)}
          onPress={() => {
            onEdit(set, 'reps');
          }}
        />
      </Tappable>
      <Tappable
        accessibilityRole="checkbox"
        accessibilityLabel={`Set ${number} done`}
        accessibilityState={{ checked: set.checked }}
        onPress={() => {
          onToggle(set);
        }}
        style={[styles.check, { height: size.touchTargetMin }]}
      >
        <View
          style={[
            styles.box,
            {
              borderRadius: radius.control,
              borderColor: set.checked ? colors.primary : colors.muted,
              backgroundColor: set.checked ? colors.primary : undefined,
            },
          ]}
        >
          {set.checked && <CheckIcon color={colors.onPrimary} size={18} />}
        </View>
      </Tappable>
    </View>
  );
}

/** The open exercise: its actions, its sets and Add set. */
export function OpenExercise({
  workoutId,
  exercise,
  units,
  adding,
  onEdit,
  onToggle,
  onAddSet,
  onRemove,
}: {
  workoutId: string;
  exercise: WorkoutExercise;
  units: Units;
  adding: boolean;
  onEdit: (set: WorkoutSet, field: SetField) => void;
  onToggle: (set: WorkoutSet) => void;
  onAddSet: () => void;
  onRemove: () => void;
}) {
  const { colors, radius, space, text } = useTheme();
  const router = useRouter();

  return (
    <View
      testID="open-exercise"
      style={[
        styles.open,
        {
          gap: space.sm,
          marginVertical: space.sm,
          padding: space.lg,
          borderRadius: radius.card,
          borderColor: colors.primary,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View style={styles.heading}>
        <View style={styles.title}>
          <Tappable
            accessibilityRole="link"
            accessibilityLabel={`${exercise.name} details`}
            testID="exercise-name"
            hitSlop={space.sm}
            onPress={() => {
              router.push(`/workout/exercise/${exercise.exerciseId}` as Href);
            }}
            style={styles.name}
          >
            {/* A no-break space keeps the icon with the last word when the name wraps. */}
            <Text style={[text.listItemName, { color: colors.text }]}>
              {`${exercise.name} `}
              <OpenOutIcon color={colors.muted} size={14} />
            </Text>
            <ExerciseTargetLine exercise={exercise} />
          </Tappable>
        </View>
        <ExerciseAction
          label={`Swap ${exercise.name}`}
          muted={checkedSets(exercise) > 0}
          onPress={() => {
            if (checkedSets(exercise) > 0) {
              notifyFailure(
                "An exercise with checked sets can't be swapped. Uncheck them first.",
              );
              return;
            }

            router.push(
              `/workout/log/${workoutId}/add?swap=${exercise.id}` as Href,
            );
          }}
        >
          <SwapIcon color={colors.muted} size={20} />
        </ExerciseAction>
        <ExerciseAction label={`Remove ${exercise.name}`} onPress={onRemove}>
          <TrashIcon color={colors.dangerFill} size={20} />
        </ExerciseAction>
      </View>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.row, { gap: space.xs, marginTop: space.sm }]}
      >
        <View style={styles.number} />
        <View style={styles.lastTime}>
          <SectionTitle>Last time</SectionTitle>
        </View>
        <View style={[styles.valueWidth, styles.centered]}>
          <SectionTitle>{weightUnitOf(units)}</SectionTitle>
        </View>
        <View style={[styles.valueWidth, styles.centered]}>
          <SectionTitle>Reps</SectionTitle>
        </View>
        <View style={styles.check} />
      </View>

      <View style={{ gap: 2 }}>
        {exercise.sets.map((set, index) => (
          <SetRow
            key={set.id}
            exercise={exercise}
            set={set}
            index={index}
            units={units}
            onEdit={onEdit}
            onToggle={onToggle}
          />
        ))}
      </View>

      <Button
        label="Add set"
        variant="secondary"
        icon={PlusIcon}
        waiting={adding}
        waitingLabel="Adding set"
        muted={exercise.sets.length >= maxSetsPerExercise}
        onPress={() => {
          if (exercise.sets.length >= maxSetsPerExercise) {
            notifyFailure(
              `An exercise can have at most ${String(maxSetsPerExercise)} sets.`,
            );
            return;
          }

          onAddSet();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  closed: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  open: {
    borderWidth: 1,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    alignItems: 'flex-start',
  },
  name: {
    gap: 2,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
  },
  number: {
    width: 30,
    paddingLeft: 6,
  },
  lastTime: {
    flex: 1,
    minWidth: 0,
  },
  noLastTime: {
    textAlign: 'center',
  },
  valueWidth: {
    width: 64,
  },
  centered: {
    alignItems: 'center',
  },
  value: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  check: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
