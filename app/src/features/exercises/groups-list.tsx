import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { DraggableList } from '@/components/draggable-list';
import { ChevronRightIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-provider';

type Group = components['schemas']['GroupListItemResponse'];

/** How many exercises use a group, in words. */
export function countOf({ exerciseCount }: { exerciseCount: number }) {
  return exerciseCount === 1
    ? '1 exercise'
    : `${String(exerciseCount)} exercises`;
}

interface GroupsListProps {
  groups: readonly Group[];
  onDragChange: (dragging: boolean) => void;
  onReorder: (groups: Group[]) => void;
  onOpen: (group: Group) => void;
  /** Shows the groups without handles, while only some of them show. */
  locked: boolean;
}

/** The groups, with a handle on each to drag it to another place. */
export function GroupsList({
  groups,
  onDragChange,
  onReorder,
  onOpen,
  locked,
}: GroupsListProps) {
  const { colors, space, text } = useTheme();

  return (
    <DraggableList
      items={groups}
      keyOf={(group) => group.id}
      moveLabel={(group) => `Move ${group.name}`}
      onDragChange={onDragChange}
      onReorder={onReorder}
      locked={locked}
      renderRow={(group) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${group.name}, ${countOf(group)}`}
          onPress={() => {
            onOpen(group);
          }}
          style={[styles.name, { gap: space.md, paddingRight: space.md }]}
        >
          <View style={styles.nameText}>
            <Text
              numberOfLines={1}
              style={[text.listItemName, { color: colors.text }]}
            >
              {group.name}
            </Text>
            <Text style={text.meta}>{countOf(group)}</Text>
          </View>
          <ChevronRightIcon color={colors.muted} size={16} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  name: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  nameText: {
    flex: 1,
    gap: 2,
  },
});
