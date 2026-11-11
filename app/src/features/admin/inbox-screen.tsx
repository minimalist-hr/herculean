import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyCard } from '@/components/empty-card';
import { LoadFailure } from '@/components/load-failure';
import { ScreenHeading } from '@/components/screen-heading';
import { TextLink } from '@/components/text-link';
import { emptyTitles, StatusChips } from '@/features/feedback/status-chips';
import {
  TicketList,
  TicketListSkeleton,
  TicketRow,
} from '@/features/feedback/ticket-rows';
import { SignOutSheet } from '@/features/settings/account-sheets';
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
  const insets = useSafeAreaInsets();
  const { colors, size, space } = useTheme();
  const [filter, setFilter] = useState<InboxFilter>('open');
  const inbox = useInbox(filter);
  const [signingOut, setSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function pullToRefresh() {
    setRefreshing(true);
    await inbox.refetch();
    setRefreshing(false);
  }

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
                  pathname: '/admin/[id]',
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
          paddingBottom: insets.bottom + space.xl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void pullToRefresh();
            }}
            tintColor={colors.primaryText}
            colors={[colors.primary]}
            progressBackgroundColor={colors.raised}
          />
        }
      >
        <View style={{ paddingHorizontal: size.sidePadding }}>
          <ScreenHeading
            title="Feedback"
            action={
              <TextLink
                label="Sign out"
                onPress={() => {
                  setSigningOut(true);
                }}
              />
            }
          />
        </View>
        <StatusChips selected={filter} onSelect={setFilter} />
        <View style={{ paddingHorizontal: size.sidePadding }}>
          {renderList()}
        </View>
      </ScrollView>
      <SignOutSheet
        visible={signingOut}
        onClose={() => {
          setSigningOut(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
