import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { usePullToRefresh } from '@/components/pull-to-refresh';
import { BackLink } from '@/components/back-link';
import { LoadFailure } from '@/components/load-failure';
import { ScreenHeading } from '@/components/screen-heading';
import { Skeleton } from '@/components/skeleton';
import { StatusLabel } from '@/components/status-label';
import { useTheme } from '@/theme/theme-provider';

import {
  backLabel,
  closedMessage,
  notLoadedMessage,
  statusColor,
  statusLabels,
  typeLabels,
} from './feedback-labels';
import { ScreenshotViewer } from './screenshot-viewer';
import {
  MessageCard,
  ReplyBox,
  ThreadSkeleton,
  useMinuteClock,
  useScrollToNew,
} from './thread';
import { useMarkRead, useReply, useTicket } from './use-feedback';

/** A ticket: its thread, oldest first, and a reply box. */
export function TicketScreen() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { colors, size, space } = useTheme();
  const ticket = useTicket(id);
  const markRead = useMarkRead(id);
  const reply = useReply(id);
  const unread = ticket.data?.hasUnreadReply === true;
  const now = useMinuteClock();
  const refreshControl = usePullToRefresh(() => ticket.refetch());
  const [viewing, setViewing] = useState<string | null>(null);
  const {
    ref: scrollRef,
    onContentSizeChange,
    follow: followNewMessage,
  } = useScrollToNew();

  // Opening a ticket reads its replies.
  const { mutate: read } = markRead;
  useEffect(() => {
    if (unread) {
      read();
    }
  }, [unread, read]);

  function renderThread() {
    if (ticket.data !== undefined) {
      return ticket.data.messages.map((message) => (
        <MessageCard
          key={message.id}
          ticketId={id}
          message={message}
          reader="user"
          author={message.author === 'admin' ? 'Minimalist' : 'You'}
          now={now}
          onOpen={setViewing}
        />
      ));
    }

    if (ticket.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load this feedback."
          onRetry={() => {
            void ticket.refetch();
          }}
        />
      );
    }

    return <ThreadSkeleton label="Loading this feedback" />;
  }

  function unavailableReason() {
    if (ticket.data === undefined) {
      return notLoadedMessage;
    }

    return ticket.data.status === 'closed' ? closedMessage : undefined;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          testID="ticket-scroll"
          ref={scrollRef}
          onContentSizeChange={onContentSizeChange}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          contentContainerStyle={{
            gap: space.xl,
            paddingTop: size.topPaddingSubPage,
            paddingHorizontal: size.sidePadding,
            paddingBottom: space.lg,
          }}
        >
          <View style={{ gap: space.xxxs }}>
            <BackLink
              label={backLabel(from)}
              onPress={() => {
                router.back();
              }}
            />
            <View style={{ gap: space.xs }}>
              <ScreenHeading
                title={
                  ticket.data === undefined
                    ? null
                    : typeLabels[ticket.data.type]
                }
              />
              {ticket.data === undefined ? (
                <Skeleton width={80} height={12} />
              ) : (
                <StatusLabel
                  label={statusLabels[ticket.data.status]}
                  color={statusColor(ticket.data.status, colors)}
                />
              )}
            </View>
          </View>
          {renderThread()}
        </ScrollView>
        <ReplyBox
          send={(draft) => reply.mutateAsync(draft)}
          sending={reply.isPending}
          unavailableReason={unavailableReason()}
          closedMessage={closedMessage}
          onSent={followNewMessage}
        />
      </KeyboardAvoidingView>
      <ScreenshotViewer
        image={viewing}
        onClose={() => {
          setViewing(null);
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
