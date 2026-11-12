import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePageEnd } from '@/components/above-tab-bar';
import { BackLink } from '@/components/back-link';
import { EmptyCard } from '@/components/empty-card';
import { useFormDelete, type FormDelete } from '@/components/form-delete';
import { HeaderIconButton } from '@/components/header-icon-button';
import { PencilIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { SectionTitle } from '@/components/section-title';
import { ExerciseRow } from '@/features/exercises/exercise-row';
import { DetailsSkeleton } from '@/features/exercises/exercises-skeleton';
import { countOf } from '@/features/exercises/groups-list';
import {
  SettingsRow,
  SettingsSection,
} from '@/features/settings/settings-rows';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { alsoWorksDetail, alsoWorksNames } from './starter-exercises-screen';
import {
  groupInUse,
  useDeleteStarterExercise,
  useDeleteStarterGroup,
  useStarterExercises,
  useStarterGroups,
  type StarterExercise,
  type StarterGroup,
} from './use-starter-content';

/** A details page's back link, and the page as it loads or fails. Both read the starter lists. */
function StarterDetailsPage({
  back,
  loadingLabel,
  children,
}: {
  back: string;
  loadingLabel: string;
  /** The page once both lists are read, or null while they load or after they failed. */
  children: (
    groups: readonly StarterGroup[],
    exercises: readonly StarterExercise[],
  ) => ReactNode;
}) {
  const router = useRouter();
  const { colors, size } = useTheme();
  const pageEnd = usePageEnd();
  const groups = useStarterGroups();
  const exercises = useStarterExercises();

  function renderContent() {
    if (groups.data !== undefined && exercises.data !== undefined) {
      return children(groups.data, exercises.data);
    }

    if (groups.isLoadingError || exercises.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load starter exercises."
          onRetry={() => {
            void groups.refetch();
            void exercises.refetch();
          }}
        />
      );
    }

    return <DetailsSkeleton label={loadingLabel} />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: pageEnd,
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

/** The title with Edit and Delete beside it, and a line below. */
function DetailsHeading({
  title,
  subtitle,
  editLabel,
  onEdit,
  remove,
}: {
  title: string;
  subtitle?: string;
  editLabel: string;
  onEdit: () => void;
  remove: FormDelete;
}) {
  const { colors, space, text } = useTheme();
  const deleting = useFormDelete(remove);

  return (
    <View style={styles.heading}>
      <View style={[styles.titleRow, { gap: space.sm }]}>
        <Text
          accessibilityRole="header"
          style={[text.pageTitle, styles.title, { color: colors.text }]}
        >
          {title}
        </Text>
        <HeaderIconButton label={editLabel} onPress={onEdit}>
          <PencilIcon color={colors.text} size={20} />
        </HeaderIconButton>
        {deleting.headerAction}
      </View>
      {subtitle !== undefined && (
        <Text style={[text.body, { color: colors.muted }]}>{subtitle}</Text>
      )}
      {deleting.sheet}
    </View>
  );
}

/** A starter exercise: its group and the groups it also works, with Edit and Delete. */
export function StarterExerciseScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const { id, back = 'Starter exercises' } = useLocalSearchParams<{
    id: string;
    back?: string;
  }>();
  const remove = useDeleteStarterExercise(id);

  return (
    <StarterDetailsPage back={back} loadingLabel="Loading the exercise">
      {(groups, exercises) => {
        const exercise = exercises.find((saved) => saved.id === id);
        // Deleting it leaves the page, so a missing one is already gone.
        if (exercise === undefined) {
          return null;
        }

        const alsoWorks = alsoWorksNames(exercise, groups);

        return (
          <View style={{ gap: space.xl, marginTop: space.xxxs }}>
            <DetailsHeading
              title={exercise.name}
              editLabel="Edit starter exercise"
              onEdit={() => {
                router.push({
                  pathname: '/admin/settings/starter/edit/[id]',
                  params: { id },
                });
              }}
              remove={{
                label: 'Delete starter exercise',
                title: `Delete ${exercise.name}?`,
                message:
                  'New accounts won’t get it. Accounts already made keep theirs.',
                deleting: remove.isPending,
                onDelete: () => remove.mutateAsync(),
                deletedMessage: `${exercise.name} deleted.`,
                failureMessage: 'Couldn’t delete the exercise. Try again.',
              }}
            />
            <SettingsSection>
              <SettingsRow
                first
                label="Group"
                value={
                  groups.find((group) => group.id === exercise.groupId)?.name
                }
              />
              <SettingsRow
                label="Also works"
                value={alsoWorks.length === 0 ? 'None' : alsoWorks.join(', ')}
              />
            </SettingsSection>
          </View>
        );
      }}
    </StarterDetailsPage>
  );
}

/** A starter group: the starter exercises in it and those that also work it, with Edit and Delete. */
export function StarterGroupScreen() {
  const router = useRouter();
  const { size, space } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const remove = useDeleteStarterGroup(id);

  return (
    <StarterDetailsPage back="Starter groups" loadingLabel="Loading the group">
      {(groups, exercises) => {
        const group = groups.find((saved) => saved.id === id);
        // Deleting it leaves the page, so a missing one is already gone.
        if (group === undefined) {
          return null;
        }

        const inGroup = exercises.filter((exercise) => exercise.groupId === id);
        const alsoWorking = exercises.filter((exercise) =>
          exercise.alsoWorksGroupIds.includes(id),
        );

        function renderSection(
          title: string,
          rows: readonly StarterExercise[],
          emptyMessage: string,
        ) {
          return (
            <View style={{ gap: space.sm }}>
              <SectionTitle>{title}</SectionTitle>
              {rows.length > 0 ? (
                <View>
                  {rows.map((exercise, index) => (
                    <ExerciseRow
                      key={exercise.id}
                      name={exercise.name}
                      detail={alsoWorksDetail(exercise, groups)}
                      first={index === 0}
                      last={index === rows.length - 1}
                      onPress={() => {
                        router.push({
                          pathname: '/admin/settings/starter/[id]',
                          params: { id: exercise.id, back: group?.name },
                        });
                      }}
                    />
                  ))}
                </View>
              ) : (
                <EmptyCard title="No exercises yet" message={emptyMessage} />
              )}
            </View>
          );
        }

        return (
          <View style={{ gap: size.gap.sectionMax, marginTop: space.xxxs }}>
            <DetailsHeading
              title={group.name}
              subtitle={countOf({
                exerciseCount: inGroup.length + alsoWorking.length,
              })}
              editLabel="Edit starter group"
              onEdit={() => {
                router.push({
                  pathname: '/admin/settings/starter/groups/edit/[id]',
                  params: { id },
                });
              }}
              remove={{
                label: `Delete ${group.name}`,
                title: `Delete ${group.name}?`,
                message: 'New accounts won’t get it.',
                mutedReason: groupInUse(exercises, id)
                  ? 'Move its exercises to another group first.'
                  : undefined,
                deleting: remove.isPending,
                onDelete: () => remove.mutateAsync(),
                deletedMessage: `${group.name} deleted.`,
                failureMessage: 'Couldn’t delete the group. Try again.',
              }}
            />
            {renderSection(
              'Exercises',
              inGroup,
              'Choose this group when you create or edit one.',
            )}
            {renderSection(
              'Also works',
              alsoWorking,
              'Choose this group under Also works when you create or edit an exercise.',
            )}
          </View>
        );
      }}
    </StarterDetailsPage>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: tokens.space.xxs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
});
