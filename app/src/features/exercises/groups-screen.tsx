import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackLink } from '@/components/back-link';
import { HeaderIconButton } from '@/components/header-icon-button';
import { PlusIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
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
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <View
          style={{
            gap: 4,
            paddingTop: size.topPaddingSubPage,
            paddingHorizontal: size.sidePadding,
            paddingBottom: space.lg,
          }}
        >
          <BackLink
            label="Exercises"
            onPress={() => {
              router.back();
            }}
          />
          <View style={[styles.titleRow, { gap: space.md }]}>
            <View style={styles.title}>
              <Text
                accessibilityRole="header"
                style={[text.pageTitle, { color: colors.text }]}
              >
                Groups
              </Text>
              <Text style={[text.body, { color: colors.muted }]}>
                Sort your exercise list. Drag to change the order of the chips.
              </Text>
            </View>
            <HeaderIconButton
              label="New group"
              onPress={() => {
                setCreateKey((key) => key + 1);
                setCreating(true);
              }}
            >
              <PlusIcon color={colors.text} size={20} />
            </HeaderIconButton>
          </View>
        </View>
        <ScrollView
          scrollEnabled={!dragging}
          contentContainerStyle={{
            gap: size.gap.sectionMax,
            paddingHorizontal: size.sidePadding,
            paddingBottom: space.xl,
          }}
        >
          {renderList()}
        </ScrollView>
      </View>
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
  screen: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    gap: 4,
  },
  skeletonRow: {
    justifyContent: 'center',
    borderWidth: 1,
  },
});
