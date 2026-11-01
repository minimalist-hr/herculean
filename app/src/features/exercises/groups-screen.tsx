import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackLink } from '@/components/back-link';
import { PlusIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { ScreenHeading } from '@/components/screen-heading';
import { Skeleton } from '@/components/skeleton';
import { useTheme } from '@/theme/theme-provider';

import { GroupNameSheet } from './group-name-sheet';
import { GroupsList } from './groups-list';
import { useCreateGroup } from './use-create-group';
import { useGroupOrder } from './use-group-order';
import { useGroups } from './use-groups';

export function GroupsScreen() {
  const { colors, radius, size, space, text } = useTheme();
  const router = useRouter();
  const groups = useGroups();
  const createGroup = useCreateGroup();
  const saveOrder = useGroupOrder();
  const [dragging, setDragging] = useState(false);
  const [creating, setCreating] = useState(false);
  // Each new group starts with an empty form.
  const [createKey, setCreateKey] = useState(0);

  function renderList() {
    if (groups.data !== undefined) {
      return (
        <>
          <GroupsList
            groups={groups.data}
            onDragChange={setDragging}
            onReorder={saveOrder}
            onOpen={(group) => {
              router.push({
                pathname: '/exercises/groups/[id]',
                params: { id: group.id },
              });
            }}
          />
          <Text style={text.meta}>
            Tap a group to see its exercises, rename it or delete it.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New group"
            onPress={() => {
              setCreateKey((key) => key + 1);
              setCreating(true);
            }}
            style={[
              styles.dashedAction,
              {
                gap: space.sm,
                height: size.dashedAction,
                borderRadius: radius.card,
                borderColor: colors.border,
              },
            ]}
          >
            <PlusIcon color={colors.text} size={16} />
            <Text style={[text.secondaryButton, { color: colors.text }]}>
              New group
            </Text>
          </Pressable>
        </>
      );
    }

    if (groups.isError) {
      return (
        <LoadFailure
          message="Couldn't load your groups."
          onRetry={() => {
            void groups.refetch();
          }}
        />
      );
    }

    return (
      <View
        accessible
        accessibilityLabel="Loading groups"
        accessibilityLiveRegion="polite"
        style={{ gap: space.sm }}
      >
        {[80, 70, 100, 70, 80, 60].map((width, index) => (
          <View
            key={index}
            style={[
              styles.skeletonRow,
              {
                gap: space.sm,
                height: size.optionRowMin,
                paddingHorizontal: space.lg,
                borderRadius: radius.card,
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Skeleton width={width} height={14} />
            <Skeleton width={90} height={10} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <>
      <ScrollView
        scrollEnabled={!dragging}
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{
          gap: size.gap.sectionMax,
          paddingTop: size.topPaddingSubPage,
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.xl,
        }}
      >
        <View>
          <BackLink
            label="Exercises"
            onPress={() => {
              router.back();
            }}
          />
          <ScreenHeading
            title="Groups"
            subtitle="Sort your exercise list. Drag to change the order of the chips."
          />
        </View>
        {renderList()}
      </ScrollView>
      {createKey > 0 && (
        <GroupNameSheet
          key={createKey}
          visible={creating}
          title="New group"
          message="It’s added at the end of your groups and chips."
          initialName=""
          saving={createGroup.isPending}
          onSave={(name) => createGroup.mutateAsync(name)}
          onClose={() => {
            setCreating(false);
          }}
          savedMessage={(name) => `${name} created.`}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dashedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  skeletonRow: {
    justifyContent: 'center',
    borderWidth: 1,
  },
});
