import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BackLink } from '@/components/back-link';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { LoadFailure } from '@/components/load-failure';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { Sheet } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { StatusLabel } from '@/components/status-label';
import {
  notLoadedMessage,
  statusColor,
  statusLabels,
  typeLabels,
} from '@/features/feedback/feedback-labels';
import { ScreenshotViewer } from '@/features/feedback/screenshot-viewer';
import {
  MessageCard,
  ReplyBox,
  ThreadSkeleton,
  useMinuteClock,
  useScrollToNew,
} from '@/features/feedback/thread';
import { useTheme } from '@/theme/theme-provider';

import { senderOf } from './inbox-screen';
import {
  useAdminReply,
  useInboxTicket,
  useUpdateTicketStatus,
} from './use-inbox';

const reopenToReply = 'Reopen it to reply.';

/** A ticket for the admin: who sent it, from which device, its thread, its status and a reply box. */
export function InboxTicketScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, size, space, text } = useTheme();
  const ticket = useInboxTicket(id);
  const reply = useAdminReply(id);
  const updateStatus = useUpdateTicketStatus(id);
  const now = useMinuteClock();
  const [refreshing, setRefreshing] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const {
    ref: scrollRef,
    onContentSizeChange,
    follow: followNewMessage,
  } = useScrollToNew();
  const closed = ticket.data?.status === 'closed';

  async function pullToRefresh() {
    setRefreshing(true);
    await ticket.refetch();
    setRefreshing(false);
  }

  async function changeStatus() {
    dismissNotification();
    try {
      await updateStatus.mutateAsync(closed ? 'open' : 'closed');
    } catch {
      notifyFailure('Couldn’t change the status. Try again.');
    } finally {
      setConfirming(false);
    }
  }

  function renderTicket() {
    if (ticket.data !== undefined) {
      const { data } = ticket;

      return (
        <>
          <Card>
            <View style={{ gap: space.xxs }}>
              <Text style={[text.listItemName, { color: colors.text }]}>
                {senderOf(data)}
              </Text>
              {data.senderName !== null && data.senderEmail !== null && (
                <Text style={text.meta}>{data.senderEmail}</Text>
              )}
              <Text style={text.meta}>
                {[`Version ${data.appVersion}`, data.phone, data.os]
                  .filter((part) => part !== null)
                  .join(' · ')}
              </Text>
            </View>
          </Card>
          <Button
            label={closed ? 'Reopen ticket' : 'Close ticket'}
            variant={closed ? 'secondary' : 'dangerOutline'}
            onPress={() => {
              dismissNotification();
              setConfirming(true);
            }}
          />
          {data.messages.map((message) => (
            <MessageCard
              key={message.id}
              ticketId={id}
              message={message}
              reader="admin"
              author={message.author === 'admin' ? 'You' : senderOf(data)}
              now={now}
              onOpen={setViewing}
            />
          ))}
        </>
      );
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

    return closed ? reopenToReply : undefined;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          testID="inbox-ticket-scroll"
          ref={scrollRef}
          onContentSizeChange={onContentSizeChange}
          keyboardShouldPersistTaps="handled"
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
          contentContainerStyle={{
            gap: space.xl,
            paddingTop: size.topPaddingSubPage,
            paddingHorizontal: size.sidePadding,
            paddingBottom: space.lg,
          }}
        >
          <View style={{ gap: space.xxxs }}>
            <BackLink
              label="Feedback"
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
          {renderTicket()}
        </ScrollView>
        <ReplyBox
          send={(draft) => reply.mutateAsync(draft)}
          sending={reply.isPending}
          unavailableReason={unavailableReason()}
          closedMessage={reopenToReply}
          onSent={followNewMessage}
        />
      </KeyboardAvoidingView>
      <Sheet
        visible={confirming}
        title={closed ? 'Reopen this ticket?' : 'Close this ticket?'}
        message={
          closed
            ? 'It waits for your reply again, and the user can reply too.'
            : 'No one can reply until you reopen it.'
        }
        onClose={() => {
          setConfirming(false);
        }}
      >
        <Button
          label={closed ? 'Reopen ticket' : 'Close ticket'}
          waitingLabel={closed ? 'Reopening ticket' : 'Closing ticket'}
          variant={closed ? 'primary' : 'danger'}
          waiting={updateStatus.isPending}
          onPress={() => void changeStatus()}
        />
      </Sheet>
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
