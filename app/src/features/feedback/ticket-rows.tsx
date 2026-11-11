import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Skeleton } from '@/components/skeleton';
import { StatusLabel } from '@/components/status-label';
import { Tappable } from '@/components/tappable';
import { formatDateTime } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { statusColor, statusLabels, typeLabels } from './feedback-labels';
import { UnreadDot } from './unread-dot';
import type { TicketStatus, TicketType } from './use-feedback';

/** Tickets in one card, with a line between rows. */
export function TicketList({ children }: { children: ReactNode }) {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {children}
    </View>
  );
}

/** A ticket in a list: its type, who sent it if that matters, its first line, status and last message, opening its thread. */
export function TicketRow({
  type,
  status,
  preview,
  lastMessageAtUtc,
  sender,
  dot,
  first,
  onPress,
}: {
  type: TicketType;
  status: TicketStatus;
  preview: string;
  lastMessageAtUtc: string;
  /** Who sent it, in the inbox. */
  sender?: string;
  /** What the dot after the type means, for example "new reply". No dot without it. */
  dot?: string;
  first: boolean;
  onPress: () => void;
}) {
  const { colors, size, space, text } = useTheme();
  const date = formatDateTime(lastMessageAtUtc);
  const typeLabel = typeLabels[type];
  const statusLabel = statusLabels[status];

  return (
    <Tappable
      feedback="fill"
      accessibilityRole="button"
      accessibilityLabel={[typeLabel, sender, preview, statusLabel, date, dot]
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
      <View style={[styles.summary, { gap: space.xxs }]}>
        <View style={[styles.line, { gap: space.sm }]}>
          <Text style={[text.listItemName, { color: colors.text }]}>
            {typeLabel}
          </Text>
          {dot !== undefined && <UnreadDot />}
        </View>
        {sender !== undefined && (
          <Text numberOfLines={1} style={text.meta}>
            {sender}
          </Text>
        )}
        <Text numberOfLines={1} style={[text.body, { color: colors.muted }]}>
          {preview}
        </Text>
        <View style={[styles.line, { gap: space.sm }]}>
          <StatusLabel
            label={statusLabel}
            color={statusColor(status, colors)}
          />
          <Text style={text.meta}>{date}</Text>
        </View>
      </View>
      <ChevronRightIcon color={colors.muted} size={16} />
    </Tappable>
  );
}

/** Rows in the shape of tickets while they load. */
export function TicketListSkeleton({
  label,
  withSender = false,
}: {
  /** What screen readers hear, for example "Loading your feedback". */
  label: string;
  withSender?: boolean;
}) {
  const { colors, size, space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
    >
      <TicketList>
        {[60, 80, 70].map((width, index) => (
          <View
            key={index}
            style={[
              styles.row,
              {
                minHeight: size.optionRowMin,
                paddingVertical: space.md,
                paddingHorizontal: space.lg,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.border,
              },
            ]}
          >
            <View style={[styles.summary, { gap: space.xs }]}>
              <Skeleton width={width} height={16} />
              {withSender && <Skeleton width={160} height={12} />}
              <Skeleton width={220} height={14} />
              <Skeleton width={140} height={12} />
            </View>
          </View>
        ))}
      </TicketList>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summary: {
    flex: 1,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
