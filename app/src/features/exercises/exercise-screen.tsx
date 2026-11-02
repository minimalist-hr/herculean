import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { HeaderIconButton } from '@/components/header-icon-button';
import { PencilIcon, TrashIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { notifySuccess } from '@/components/notifications';
import { useTheme } from '@/theme/theme-provider';

import { DeleteExerciseSheet } from './delete-exercise-sheet';
import { EditExerciseSheet } from './edit-exercise-sheet';
import { DetailsSkeleton } from './exercises-skeleton';
import { NoSessionsCard } from './no-sessions-card';
import { useExercise } from './use-exercise';

type Exercise = components['schemas']['ExerciseDetailsResponse'];

interface ExerciseScreenProps {
  id: string;
  /** The screen its back link returns to, when that isn't the exercise list. */
  back?: string;
}

export function ExerciseScreen({
  id,
  back = 'Exercises',
}: ExerciseScreenProps) {
  const { colors, size } = useTheme();
  const router = useRouter();
  const exercise = useExercise(id);

  function renderContent() {
    if (exercise.data !== undefined) {
      return <Details exercise={exercise.data} />;
    }

    if (exercise.isError) {
      return (
        <LoadFailure
          message="Couldn't load this exercise."
          onRetry={() => {
            void exercise.refetch();
          }}
        />
      );
    }

    return <DetailsSkeleton label="Loading the exercise" />;
  }

  return (
    <ScrollView
      // The edit sheet opens inside this list, so a tap on its buttons must not just close the keyboard.
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: size.gap.sectionMax,
      }}
    >
      <BackLink
        label={back}
        onPress={() => {
          router.back();
        }}
      />
      {renderContent()}
    </ScrollView>
  );
}

function Details({ exercise }: { exercise: Exercise }) {
  const { colors, radius, size, space, text } = useTheme();
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  // Each edit starts from the exercise's values at that moment.
  const [editKey, setEditKey] = useState(0);

  return (
    <View style={{ gap: size.gap.sectionMax, marginTop: 2 }}>
      <View style={styles.heading}>
        <View style={[styles.titleRow, { gap: space.sm }]}>
          <Text
            accessibilityRole="header"
            style={[text.pageTitle, styles.title, { color: colors.text }]}
          >
            {exercise.name}
          </Text>
          <HeaderIconButton
            label="Edit exercise"
            onPress={() => {
              setEditKey((key) => key + 1);
              setEditing(true);
            }}
          >
            <PencilIcon color={colors.text} size={20} />
          </HeaderIconButton>
          <HeaderIconButton
            label="Delete exercise"
            onPress={() => {
              setConfirmingDelete(true);
            }}
          >
            <TrashIcon color={colors.danger} size={20} />
          </HeaderIconButton>
        </View>
        <Text style={[text.body, { color: colors.muted }]}>
          {subtitleOf(exercise)}
        </Text>
      </View>

      <NoSessionsCard message="Finish a workout with this exercise and its sets, best set and progress show up here." />

      <View style={{ gap: space.sm }}>
        <Text style={[text.eyebrow, styles.sectionTitle]}>Used in</Text>
        <View
          style={[
            styles.usedIn,
            {
              paddingVertical: space.lg,
              paddingHorizontal: 14,
              borderRadius: radius.card,
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Text style={[text.body, { color: colors.muted }]}>
            Not in any routine yet. Add it from Edit routine on the Routines
            tab.
          </Text>
        </View>
      </View>

      {editKey > 0 && (
        <EditExerciseSheet
          key={editKey}
          visible={editing}
          exercise={exercise}
          onSaved={(saved) => {
            setEditing(false);
            notifySuccess(`${saved.name} saved.`);
          }}
          onClose={() => {
            setEditing(false);
          }}
        />
      )}

      <DeleteExerciseSheet
        exercise={exercise}
        visible={confirmingDelete}
        onClose={() => {
          setConfirmingDelete(false);
        }}
        onDeleted={() => {
          notifySuccess(`${exercise.name} deleted.`);
          router.back();
        }}
      />
    </View>
  );
}

function subtitleOf({ group, alsoWorksGroups }: Exercise) {
  return [
    group.name,
    ...alsoWorksGroups.map((alsoWorks) => alsoWorks.name.toLowerCase()),
  ].join(' · ');
}

const styles = StyleSheet.create({
  heading: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
  sectionTitle: {
    paddingHorizontal: 4,
  },
  usedIn: {
    borderWidth: 1,
  },
});
