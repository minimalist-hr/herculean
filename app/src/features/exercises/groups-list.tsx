import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { ChevronRightIcon } from '@/components/icons';
import { Tappable } from '@/components/tappable';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

type Group = components['schemas']['GroupListItemResponse'];

/** How many exercises use a group, in words. */
export function countOf({ exerciseCount }: { exerciseCount: number }) {
  return exerciseCount === 1
    ? '1 exercise'
    : `${String(exerciseCount)} exercises`;
}

/** A group's name, with how many exercises use it under it. */
export function GroupSummary({ group }: { group: Group }) {
  const { colors, text } = useTheme();

  return (
    <View style={styles.summary}>
      <Text
        numberOfLines={1}
        style={[text.listItemName, { color: colors.text }]}
      >
        {group.name}
      </Text>
      <Text style={text.meta}>{countOf(group)}</Text>
    </View>
  );
}

/** The groups in one card, each opening its group. */
export function GroupsList({
  groups,
  onOpen,
}: {
  groups: readonly Group[];
  onOpen: (group: Group) => void;
}) {
  const { cardLine, colors, radius, size, space } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderWidth: cardLine,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {groups.map((group, index) => (
        <Tappable
          key={group.id}
          feedback="fill"
          accessibilityRole="button"
          accessibilityLabel={`${group.name}, ${countOf(group)}`}
          onPress={() => {
            onOpen(group);
          }}
          style={[
            styles.row,
            {
              gap: space.md,
              minHeight: size.optionRowMin,
              paddingHorizontal: space.lg,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: colors.border,
            },
          ]}
        >
          <GroupSummary group={group} />
          <ChevronRightIcon color={colors.muted} size={16} />
        </Tappable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summary: {
    flex: 1,
    gap: tokens.space.xxxs,
  },
});
