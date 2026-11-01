import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { HeaderIconButton } from '@/components/header-icon-button';
import { HistoryIcon, PencilIcon, TrashIcon } from '@/components/icons';
import { notifySuccess } from '@/components/notifications';
import { useTheme } from '@/theme/theme-provider';

import { DeleteExerciseSheet } from './delete-exercise-sheet';
import { ExerciseLoadFailure } from './exercise-load-failure';
import { ExerciseSkeleton } from './exercises-skeleton';
import { useExercise } from './use-exercise';

type Exercise = components['schemas']['ExerciseDetailsResponse'];

export function ExerciseScreen({ id }: { id: string }) {
  const { colors, size } = useTheme();
  const router = useRouter();
  const exercise = useExercise(id);

  function renderContent() {
    if (exercise.data !== undefined) {
      return <Details exercise={exercise.data} />;
    }

    if (exercise.isError) {
      return (
        <ExerciseLoadFailure
          onRetry={() => {
            void exercise.refetch();
          }}
        />
      );
    }

    return <ExerciseSkeleton />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: size.gap.sectionMax,
      }}
    >
      <BackLink
        label="Exercises"
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
              router.push({
                pathname: '/edit-exercise/[id]',
                params: { id: exercise.id },
              });
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

      <View
        style={[
          styles.noSessions,
          {
            gap: space.sm,
            paddingTop: 28,
            paddingBottom: size.gap.sectionMax,
            paddingHorizontal: space.lg,
            borderRadius: radius.card,
            borderColor: colors.border,
          },
        ]}
      >
        <HistoryIcon color={colors.muted} size={28} />
        <Text style={[text.listItemName, { color: colors.text }]}>
          No sessions yet
        </Text>
        <Text style={[text.meta, styles.centered]}>
          Finish a workout with this exercise and its sets, best set and
          progress show up here.
        </Text>
      </View>

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
  noSessions: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  centered: {
    textAlign: 'center',
  },
  sectionTitle: {
    paddingHorizontal: 4,
  },
  usedIn: {
    borderWidth: 1,
  },
});
