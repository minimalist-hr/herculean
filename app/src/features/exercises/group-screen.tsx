import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { EmptyCard } from '@/components/empty-card';
import { BackLink } from '@/components/back-link';
import { Button } from '@/components/button';
import { HeaderIconButton } from '@/components/header-icon-button';
import { PencilIcon, TrashIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { notifyFailure } from '@/components/notifications';
import { Sheet } from '@/components/sheet';
import { useUnits } from '@/features/account/use-units';
import { SectionTitle } from '@/components/section-title';
import { tokens } from '@/theme/tokens';
import { useLinks } from '@/features/links/use-links';
import { useTheme } from '@/theme/theme-provider';

import { bestSetText, ExerciseRow } from './exercise-row';
import { DetailsSkeleton } from './exercises-skeleton';
import { countOf } from './groups-list';
import { useDeleteGroup } from './use-delete-group';
import { useGroup } from './use-group';
import { usePageEnd } from '@/components/above-tab-bar';

type Group = components['schemas']['GroupDetailsResponse'];
type Exercise = components['schemas']['ExerciseListItemResponse'];

export function GroupScreen({ id }: { id: string }) {
  const { colors, size } = useTheme();
  const pageEnd = usePageEnd();
  const router = useRouter();
  const group = useGroup(id);

  function renderContent() {
    if (group.data !== undefined) {
      return <Details group={group.data} />;
    }

    if (group.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load this group."
          onRetry={() => {
            void group.refetch();
          }}
        />
      );
    }

    return <DetailsSkeleton label="Loading the group" />;
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
        label="Groups"
        onPress={() => {
          router.back();
        }}
      />
      {renderContent()}
    </ScrollView>
  );
}

function Details({ group }: { group: Group }) {
  const { colors, opacity, size, space, text } = useTheme();
  const router = useRouter();
  const units = useUnits();
  const links = useLinks(`group:${group.id}`);
  const deleteGroup = useDeleteGroup();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const exerciseCount =
    group.exercises.length + group.alsoWorksExercises.length;
  const count = countOf({ exerciseCount });
  const inUse = exerciseCount > 0;

  function renderRows(exercises: Exercise[]) {
    return exercises.map((exercise, index) => (
      <ExerciseRow
        key={exercise.id}
        name={exercise.name}
        detail={bestSetText(exercise, units)}
        first={index === 0}
        last={index === exercises.length - 1}
        onPress={() => {
          links.exercise(exercise.id);
        }}
      />
    ));
  }

  return (
    <View style={{ gap: size.gap.sectionMax, marginTop: space.xxxs }}>
      <View style={styles.heading}>
        <View style={[styles.titleRow, { gap: space.sm }]}>
          <Text
            accessibilityRole="header"
            style={[text.pageTitle, styles.title, { color: colors.text }]}
          >
            {group.name}
          </Text>
          <HeaderIconButton
            label="Edit group"
            onPress={() => {
              router.push({
                pathname: '/group/[id]/edit',
                params: { id: group.id },
              });
            }}
          >
            <PencilIcon color={colors.text} size={20} />
          </HeaderIconButton>
          <HeaderIconButton
            label={
              inUse
                ? `Delete ${group.name}, not available while it has exercises`
                : `Delete ${group.name}`
            }
            onPress={() => {
              if (inUse) {
                notifyFailure('Move or delete this group’s exercises first.');
              } else {
                setConfirmingDelete(true);
              }
            }}
          >
            <View style={{ opacity: inUse ? opacity.disabled : 1 }}>
              <TrashIcon
                color={inUse ? colors.muted : colors.dangerFill}
                size={20}
              />
            </View>
          </HeaderIconButton>
        </View>
        <Text style={[text.body, { color: colors.muted }]}>{count}</Text>
      </View>

      <View style={{ gap: space.sm }}>
        <SectionTitle>Exercises</SectionTitle>
        {group.exercises.length > 0 ? (
          <View>{renderRows(group.exercises)}</View>
        ) : (
          <EmptyCard
            title="No exercises yet"
            message="Choose this group when you create or edit one."
          />
        )}
      </View>

      <View style={{ gap: space.sm }}>
        <SectionTitle>Also works</SectionTitle>
        {group.alsoWorksExercises.length > 0 ? (
          <View>{renderRows(group.alsoWorksExercises)}</View>
        ) : (
          <EmptyCard
            title="No exercises yet"
            message="Choose this group under Also works when you create or edit an exercise."
          />
        )}
      </View>

      <Sheet
        visible={confirmingDelete}
        title={`Delete ${group.name}?`}
        message="It has no exercises, so nothing else changes."
        onClose={() => {
          setConfirmingDelete(false);
        }}
      >
        <Button
          label="Delete group"
          variant="danger"
          waitingLabel="Deleting group"
          waiting={deleteGroup.isPending}
          onPress={() => {
            deleteGroup.mutate(group, {
              onSuccess: () => {
                router.back();
              },
            });
          }}
        />
      </Sheet>
    </View>
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
