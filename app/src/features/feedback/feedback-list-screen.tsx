import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { usePageEnd } from '@/components/above-tab-bar';
import { BackLink } from '@/components/back-link';
import { EmptyCard } from '@/components/empty-card';
import { LoadFailure } from '@/components/load-failure';
import { NewButton, useNewButtonRoom } from '@/components/new-button';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { usePullToRefresh } from '@/components/pull-to-refresh';
import { ScreenHeading } from '@/components/screen-heading';
import { useTheme } from '@/theme/theme-provider';

import {
  emptyTitles,
  inFilter,
  StatusChips,
  type StatusFilter,
} from './status-chips';
import { TicketList, TicketListSkeleton, TicketRow } from './ticket-rows';
import { blockedMessage } from './feedback-labels';
import { useFeedbackBlocked, useTickets } from './use-feedback';

/** Your feedback: every ticket you sent, the latest first. */
export function FeedbackListScreen() {
  const router = useRouter();
  const { colors, size, space } = useTheme();
  const pageEnd = usePageEnd();
  const newButtonRoom = useNewButtonRoom();
  const tickets = useTickets();
  const blocked = useFeedbackBlocked().data === true;
  const refreshControl = usePullToRefresh(() => tickets.refetch());
  const [filter, setFilter] = useState<StatusFilter>('answered');
  const noFeedback = tickets.data?.length === 0;

  function renderList() {
    if (tickets.data !== undefined) {
      const shown = tickets.data.filter((ticket) =>
        inFilter(ticket.status, filter),
      );
      if (shown.length === 0) {
        return (
          <EmptyCard
            title={emptyTitles[noFeedback ? 'all' : filter]}
            message={
              noFeedback
                ? 'Report a bug or suggest something.'
                : 'Pick All to see everything you sent.'
            }
          />
        );
      }

      return (
        <TicketList>
          {shown.map((ticket, index) => (
            <TicketRow
              key={ticket.id}
              type={ticket.type}
              status={ticket.status}
              preview={ticket.preview}
              lastMessageAtUtc={ticket.lastMessageAtUtc}
              dot={ticket.hasUnreadReply ? 'new reply' : undefined}
              first={index === 0}
              onPress={() => {
                router.push({
                  pathname: '/settings/feedback/[id]',
                  params: { id: ticket.id },
                });
              }}
            />
          ))}
        </TicketList>
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

    return <TicketListSkeleton label="Loading your feedback" />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        testID="feedback-list-scroll"
        refreshControl={refreshControl}
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
        <View style={{ marginHorizontal: -size.sidePadding }}>
          <StatusChips
            selected={filter}
            onSelect={setFilter}
            mutedReason={noFeedback ? 'Send feedback first.' : undefined}
          />
        </View>
        {renderList()}
      </ScrollView>
      <NewButton
        label="New feedback"
        muted={blocked}
        onPress={() => {
          if (blocked) {
            notifyFailure(blockedMessage);
            return;
          }

          dismissNotification();
          router.push('/settings/feedback/new');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
