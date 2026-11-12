import { StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { ListCard } from '@/components/list-card';
import { Skeleton } from '@/components/skeleton';
import { Tappable } from '@/components/tappable';
import { formatLocalDate, formatRelativeTime } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { UserAvatar } from './user-avatar';
import type { UserListItem } from './use-users';

/** Who a user is: their name, or their email without one. */
export function nameOf(user: Pick<UserListItem, 'name' | 'email'>) {
  return user.name ?? user.email;
}

/** When a user was last active, for example "Last active 2 hours ago". */
export function lastActiveText(lastActiveAtUtc: string | null, now: Date) {
  if (lastActiveAtUtc === null) {
    return 'Never signed in';
  }

  // "Just now" and "Yesterday" read on in lower case; a day's name keeps its capital.
  const ago = formatRelativeTime(lastActiveAtUtc, now).replace(
    /^(Just now|Yesterday)/,
    (word) => word.toLowerCase(),
  );
  return `Last active ${ago}`;
}

/** When an account goes, and whether Minimalist closed it, for example "Closed · deletes on Wed, 25th Nov". */
export function deletesOnText(
  deletionScheduledForUtc: string,
  closed: boolean,
) {
  const day = formatLocalDate(deletionScheduledForUtc);
  return closed ? `Closed · deletes on ${day}` : `Deletes on ${day}`;
}

/** A user in the list: name, email, and when they were last active or get deleted, opening their page. */
export function UserRow({
  user,
  now,
  first,
  onPress,
}: {
  user: UserListItem;
  now: Date;
  first: boolean;
  onPress: () => void;
}) {
  const { colors, size, space, text } = useTheme();
  const deleting = user.deletionScheduledForUtc;
  const when =
    deleting === null
      ? lastActiveText(user.lastActiveAtUtc, now)
      : deletesOnText(deleting, user.closed);

  return (
    <Tappable
      feedback="fill"
      accessibilityRole="button"
      accessibilityLabel={[
        nameOf(user),
        user.name === null ? undefined : user.email,
        when,
      ]
        .filter((part) => part !== undefined)
        .join(', ')}
      onPress={onPress}
      style={[
        styles.row,
        {
          gap: space.md,
          minHeight: size.optionRowMin,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          borderTopWidth: first ? 0 : 1,
          borderTopColor: colors.border,
        },
      ]}
    >
      <UserAvatar user={user} size={size.userRowAvatar} />
      <View style={[styles.summary, { gap: space.xxs }]}>
        <Text
          numberOfLines={1}
          style={[text.listItemName, { color: colors.text }]}
        >
          {nameOf(user)}
        </Text>
        {user.name !== null && (
          <Text numberOfLines={1} style={text.meta}>
            {user.email}
          </Text>
        )}
        <Text
          style={[text.meta, deleting === null ? null : { color: colors.warn }]}
        >
          {when}
        </Text>
      </View>
      <ChevronRightIcon color={colors.muted} size={16} />
    </Tappable>
  );
}

/** Rows in the shape of users while they load. */
export function UserListSkeleton({
  label,
  rows = 3,
}: {
  /** What screen readers hear, for example "Loading users". */
  label: string;
  rows?: number;
}) {
  const { colors, size, space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
    >
      <ListCard>
        {[100, 80, 120].slice(0, rows).map((width, index) => (
          <View
            key={index}
            style={[
              styles.row,
              {
                gap: space.md,
                minHeight: size.optionRowMin,
                paddingVertical: space.md,
                paddingHorizontal: space.lg,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Skeleton width={size.userRowAvatar} height={size.userRowAvatar} />
            <View style={[styles.summary, { gap: space.xs }]}>
              <Skeleton width={width} height={16} />
              <Skeleton width={160} height={12} />
              <Skeleton width={120} height={12} />
            </View>
          </View>
        ))}
      </ListCard>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summary: {
    flex: 1,
  },
});
