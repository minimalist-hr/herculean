import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { usePullToRefresh } from '@/components/pull-to-refresh';
import { BackLink } from '@/components/back-link';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ChevronRightIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { Sheet } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { StatusLabel } from '@/components/status-label';
import { Tappable } from '@/components/tappable';
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
import { SavedRepliesButton } from './saved-replies-button';
import { NotesSection, PrioritySection } from './ticket-tools';
import {
  useAdminReply,
  useInboxTicket,
  useUpdateTicketStatus,
  type InboxTicketDetails,
} from './use-inbox';

const reopenToReply = 'Reopen it to reply.';

/** A ticket for the admin: who sent it, from which device, its thread, its status and a reply box. */
export function InboxTicketScreen({
  openUser,
  openNote,
}: {
  /** Opens the sender's page, with the ticket's type as its back link. */
  openUser: (userId: string, back: string) => void;
  /** Opens Add note, with the ticket's type as its back link. */
  openNote: (ticketId: string, back: string) => void;
}) {
  const router = useRouter();
  const { id, back } = useLocalSearchParams<{ id: string; back?: string }>();
  const { colors, size, space } = useTheme();
  const ticket = useInboxTicket(id);
  const reply = useAdminReply(id);
  const updateStatus = useUpdateTicketStatus(id);
  const now = useMinuteClock();
  const refreshControl = usePullToRefresh(() => ticket.refetch());
  const [viewing, setViewing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const {
    ref: scrollRef,
    onContentSizeChange,
    follow: followNewMessage,
  } = useScrollToNew();
  const closed = ticket.data?.status === 'closed';

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
          <SenderCard
            ticket={data}
            onPress={
              // Once the account is gone, there is no page to open.
              data.senderEmail === null
                ? undefined
                : () => {
                    openUser(data.senderId, typeLabels[data.type]);
                  }
            }
          />
          <Button
            label={closed ? 'Reopen ticket' : 'Close ticket'}
            variant={closed ? 'secondary' : 'dangerOutline'}
            onPress={() => {
              dismissNotification();
              setConfirming(true);
            }}
          />
          <PrioritySection ticketId={id} priority={data.priority} />
          <NotesSection
            ticketId={id}
            notes={data.notes}
            onAdd={() => {
              dismissNotification();
              openNote(id, typeLabels[data.type]);
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
              label={back ?? 'Feedback'}
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
          extraAction={(insert) => (
            <SavedRepliesButton
              name={ticket.data?.senderName ?? null}
              onPick={insert}
            />
          )}
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

/** Who sent the ticket and from which device. It opens their page while the account exists. */
function SenderCard({
  ticket,
  onPress,
}: {
  ticket: InboxTicketDetails;
  onPress?: () => void;
}) {
  const { colors, line, radius, space, text } = useTheme();
  const device = [`Version ${ticket.appVersion}`, ticket.phone, ticket.os]
    .filter((part) => part !== null)
    .join(' · ');
  const details = (
    <View style={[styles.summary, { gap: space.xxs }]}>
      <Text style={[text.listItemName, { color: colors.text }]}>
        {senderOf(ticket)}
      </Text>
      {ticket.senderName !== null && ticket.senderEmail !== null && (
        <Text style={text.meta}>{ticket.senderEmail}</Text>
      )}
      <Text style={text.meta}>{device}</Text>
    </View>
  );

  if (onPress === undefined) {
    return <Card>{details}</Card>;
  }

  return (
    <Tappable
      feedback="fill"
      accessibilityRole="button"
      accessibilityLabel={[senderOf(ticket), ticket.senderEmail, device]
        .filter((part) => part !== null)
        .join(', ')}
      onPress={onPress}
      style={[
        styles.line,
        {
          gap: space.md,
          padding: space.lg,
          borderWidth: line,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {details}
      <ChevronRightIcon color={colors.muted} size={16} />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summary: {
    flex: 1,
  },
});
