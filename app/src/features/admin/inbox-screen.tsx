import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { usePullToRefresh } from '@/components/pull-to-refresh';
import { usePageEnd } from '@/components/above-tab-bar';
import { EmptyCard } from '@/components/empty-card';
import { LoadFailure } from '@/components/load-failure';
import { ScreenHeading } from '@/components/screen-heading';
import { emptyTitles, StatusChips } from '@/features/feedback/status-chips';
import {
  TicketList,
  TicketListSkeleton,
  TicketRow,
} from '@/features/feedback/ticket-rows';
import { useTheme } from '@/theme/theme-provider';

import { useInbox, type InboxFilter, type InboxTicket } from './use-inbox';

/** Who sent a ticket: their name, their email without one, or that the account is gone. */
export function senderOf({
  senderName,
  senderEmail,
}: Pick<InboxTicket, 'senderName' | 'senderEmail'>) {
  return senderName ?? senderEmail ?? 'Account deleted';
}

/** The admin's first page: every user's feedback, by status. */
export function InboxScreen() {
  const router = useRouter();
  const pageEnd = usePageEnd();
  const { colors, size, space } = useTheme();
  const [filter, setFilter] = useState<InboxFilter>('open');
  const inbox = useInbox(filter);
  const refreshControl = usePullToRefresh(() => inbox.refetch());

  function renderList() {
    if (inbox.data !== undefined) {
      if (inbox.data.length === 0) {
        return (
          <EmptyCard
            title={emptyTitles[filter]}
            message="New feedback shows here."
          />
        );
      }

      return (
        <TicketList>
          {inbox.data.map((ticket, index) => (
            <TicketRow
              key={ticket.id}
              type={ticket.type}
              status={ticket.status}
              preview={ticket.preview}
              lastMessageAtUtc={ticket.lastMessageAtUtc}
              sender={senderOf(ticket)}
              dot={ticket.waitingForReply ? 'waiting for a reply' : undefined}
              first={index === 0}
              onPress={() => {
                router.push({
                  pathname: '/admin/feedback/[id]',
                  params: { id: ticket.id },
                });
              }}
            />
          ))}
        </TicketList>
      );
    }

    if (inbox.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load the inbox."
          onRetry={() => {
            void inbox.refetch();
          }}
        />
      );
    }

    return <TicketListSkeleton label="Loading the inbox" withSender />;
  }

  return (
    <>
      <ScrollView
        testID="inbox-scroll"
        style={[styles.screen, { backgroundColor: colors.bg }]}
        contentContainerStyle={{
          gap: space.xl,
          paddingTop: size.topPaddingTab,
          paddingBottom: pageEnd,
        }}
        refreshControl={refreshControl}
      >
        <View style={{ paddingHorizontal: size.sidePadding }}>
          <ScreenHeading
            title="Feedback"
            subtitle="What users report and suggest."
          />
        </View>
        <StatusChips selected={filter} onSelect={setFilter} />
        <View style={{ paddingHorizontal: size.sidePadding }}>
          {renderList()}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
