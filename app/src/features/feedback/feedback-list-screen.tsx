import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePageEnd } from '@/components/above-tab-bar';
import { BackLink } from '@/components/back-link';
import { EmptyCard } from '@/components/empty-card';
import { ChevronRightIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { NewButton, useNewButtonRoom } from '@/components/new-button';
import { dismissNotification } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { Skeleton } from '@/components/skeleton';
import { StatusLabel } from '@/components/status-label';
import { Tappable } from '@/components/tappable';
import { formatDateTime } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { statusColor, statusLabels, typeLabels } from './feedback-labels';
import { UnreadDot } from './unread-dot';
import { useTickets, type TicketListItem } from './use-feedback';

/** Your feedback: every ticket you sent, the latest first. */
export function FeedbackListScreen() {
  const router = useRouter();
  const { colors, size, space } = useTheme();
  const pageEnd = usePageEnd();
  const newButtonRoom = useNewButtonRoom();
  const tickets = useTickets();

  function renderList() {
    if (tickets.data !== undefined) {
      if (tickets.data.length === 0) {
        return (
          <EmptyCard
            title="No feedback yet"
            message="Report a bug or suggest something."
          />
        );
      }

      return (
        <ListCard>
          {tickets.data.map((ticket, index) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              first={index === 0}
              onPress={() => {
                router.push({
                  pathname: '/settings/feedback/[id]',
                  params: { id: ticket.id },
                });
              }}
            />
          ))}
        </ListCard>
      );
    }

    if (tickets.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load your feedback."
          onRetry={() => {
            void tickets.refetch();
          }}
        />
      );
    }

    return <ListSkeleton />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={{
          gap: space.xl,
          paddingTop: size.topPaddingSubPage,
          paddingHorizontal: size.sidePadding,
          paddingBottom: pageEnd + newButtonRoom,
        }}
      >
        <View style={{ gap: space.xxxs }}>
          <BackLink
            label="Profile"
            onPress={() => {
              router.back();
            }}
          />
          <ScreenHeading
            title="Your feedback"
            subtitle="Bugs, suggestions and anything else you sent."
          />
        </View>
        {renderList()}
      </ScrollView>
      <NewButton
        label="New feedback"
        onPress={() => {
          dismissNotification();
          router.push('/settings/feedback/new');
        }}
      />
    </View>
  );
}

function ListCard({ children }: { children: React.ReactNode }) {
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

function TicketRow({
  ticket,
  first,
  onPress,
}: {
  ticket: TicketListItem;
  first: boolean;
  onPress: () => void;
}) {
  const { colors, size, space, text } = useTheme();
  const date = formatDateTime(ticket.lastMessageAtUtc);
  const type = typeLabels[ticket.type];
  const status = statusLabels[ticket.status];

  return (
    <Tappable
      feedback="fill"
      accessibilityRole="button"
      accessibilityLabel={[
        type,
        ticket.preview,
        status,
        date,
        ticket.hasUnreadReply ? 'new reply' : undefined,
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
      <View style={[styles.summary, { gap: space.xxs }]}>
        <View style={[styles.meta, { gap: space.sm }]}>
          <Text style={[text.listItemName, { color: colors.text }]}>
            {type}
          </Text>
          {ticket.hasUnreadReply && <UnreadDot />}
        </View>
        <Text numberOfLines={1} style={[text.body, { color: colors.muted }]}>
          {ticket.preview}
        </Text>
        <View style={[styles.meta, { gap: space.sm }]}>
          <StatusLabel
            label={status}
            color={statusColor(ticket.status, colors)}
          />
          <Text style={text.meta}>{date}</Text>
        </View>
      </View>
      <ChevronRightIcon color={colors.muted} size={16} />
    </Tappable>
  );
}

function ListSkeleton() {
  const { colors, size, space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel="Loading your feedback"
      accessibilityLiveRegion="polite"
    >
      <ListCard>
        {[60, 80, 70].map((width, index) => (
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
            <View style={[styles.summary, { gap: space.xs }]}>
              <Skeleton width={width} height={16} />
              <Skeleton width={220} height={14} />
              <Skeleton width={140} height={12} />
            </View>
          </View>
        ))}
      </ListCard>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
