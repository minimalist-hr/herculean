import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApiProblemError } from '@/api/problem';
import { BackLink } from '@/components/back-link';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { HeaderIconButton } from '@/components/header-icon-button';
import { AlertIcon, ImageIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { Skeleton } from '@/components/skeleton';
import { StatusLabel } from '@/components/status-label';
import { Tappable } from '@/components/tappable';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { photoUri } from '@/features/settings/use-user-photo';
import { formatRelativeTime } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import {
  backLabel,
  closedMessage,
  statusColor,
  statusLabels,
  typeLabels,
} from './feedback-labels';
import { messageMaxLength } from './new-feedback-screen';
import {
  DraftScreenshots,
  ScreenshotGrid,
  useAddScreenshots,
} from './screenshot-field';
import { ScreenshotViewer } from './screenshot-viewer';
import {
  useMarkRead,
  useReply,
  useScreenshot,
  useTicket,
  type TicketMessage,
} from './use-feedback';

const notLoadedMessage = 'This page hasn’t loaded yet.';

const minuteMs = 60_000;

/** The time now, a minute at a time, so "5 minutes ago" keeps up. */
function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, minuteMs);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return now;
}

/** A ticket: its thread, oldest first, and a reply box. */
export function TicketScreen() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { colors, size, space } = useTheme();
  const ticket = useTicket(id);
  const markRead = useMarkRead(id);
  const unread = ticket.data?.hasUnreadReply === true;
  const now = useMinuteClock();
  const [refreshing, setRefreshing] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  async function pullToRefresh() {
    setRefreshing(true);
    await ticket.refetch();
    setRefreshing(false);
  }

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

    return (
      <View
        accessible
        accessibilityLabel="Loading this feedback"
        accessibilityLiveRegion="polite"
        style={{ gap: space.md }}
      >
        <Skeleton width="100%" height={messageSkeletonHeight} />
        <Skeleton width="100%" height={messageSkeletonHeight} />
      </View>
    );
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
        <ReplyBox ticketId={id} unavailableReason={unavailableReason()} />
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

/** A message. The user's own stand out on a raised card with the accent's border. */
function MessageCard({
  ticketId,
  message,
  now,
  onOpen,
}: {
  ticketId: string;
  message: TicketMessage;
  now: Date;
  onOpen: (image: string) => void;
}) {
  const { colors, radius, space, text } = useTheme();
  const own = message.author === 'user';

  return (
    <View
      testID={own ? 'own-message' : 'reply-message'}
      style={[
        styles.card,
        {
          gap: space.md,
          padding: space.lg,
          borderRadius: radius.card,
          borderColor: own ? colors.primary : colors.border,
          backgroundColor: own ? colors.raised : colors.card,
        },
      ]}
    >
      <View style={[styles.messageHeading, { gap: space.sm }]}>
        <Text style={text.eyebrow}>{own ? 'You' : 'Minimalist'}</Text>
        <Text style={text.meta}>
          {formatRelativeTime(message.sentAtUtc, now)}
        </Text>
      </View>
      <Text style={[text.body, { color: colors.text }]}>{message.text}</Text>
      {message.screenshotIds.length > 0 && (
        <ScreenshotGrid
          tiles={message.screenshotIds.map((screenshotId, index) => (
            <MessageScreenshot
              key={screenshotId}
              ticketId={ticketId}
              id={screenshotId}
              number={index + 1}
              onOpen={onOpen}
            />
          ))}
        />
      )}
    </View>
  );
}

/** A screenshot's thumbnail, loading on its own. Tapping it opens it full screen. */
function MessageScreenshot({
  ticketId,
  id,
  number,
  onOpen,
}: {
  ticketId: string;
  id: string;
  number: number;
  onOpen: (image: string) => void;
}) {
  const { colors, radius } = useTheme();
  const image = useScreenshot(ticketId, id);
  const label = `Screenshot ${String(number)}`;
  const tile = [
    styles.square,
    { borderRadius: radius.control, borderColor: colors.border },
  ];

  if (image.data !== undefined) {
    const loaded = image.data;

    return (
      <Tappable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          onOpen(loaded);
        }}
      >
        <Image source={{ uri: photoUri(loaded) }} style={tile} />
      </Tappable>
    );
  }

  if (image.isLoadingError) {
    return (
      <Tappable
        accessibilityRole="button"
        accessibilityLabel={`Couldn’t load screenshot ${String(number)}. Try again`}
        onPress={() => {
          void image.refetch();
        }}
        style={[tile, styles.centered, { backgroundColor: colors.raised }]}
      >
        <AlertIcon color={colors.muted} size={20} />
      </Tappable>
    );
  }

  return (
    <View style={[tile, { overflow: 'hidden' }]}>
      <Skeleton width="100%" height="100%" />
    </View>
  );
}

/** The reply box in one row: add screenshots, the reply, Send. It looks muted and says why when it can't be used. */
function ReplyBox({
  ticketId,
  unavailableReason,
}: {
  ticketId: string;
  unavailableReason?: string;
}) {
  const { colors, opacity, radius, size, space, text } = useTheme();
  const reply = useReply(ticketId);
  const [message, setMessage] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const guard = useLeaveGuard(message.trim() !== '' || screenshots.length > 0);
  const addScreenshots = useAddScreenshots(
    screenshots,
    setScreenshots,
    unavailableReason,
  );
  const muted = unavailableReason !== undefined;

  async function send() {
    if (unavailableReason !== undefined) {
      notifyFailure(unavailableReason);
      return;
    }
    if (message.trim() === '') {
      notifyFailure('Write a reply first.');
      return;
    }

    dismissNotification();
    try {
      await reply.mutateAsync({ message, screenshots });
      setMessage('');
      setScreenshots([]);
    } catch (error) {
      notifyFailure(
        error instanceof ApiProblemError &&
          error.problem.code === 'ticket.closed'
          ? closedMessage
          : 'Couldn’t send. Try again.',
      );
    }
  }

  return (
    <>
      <BottomActionBox>
        <View style={{ gap: space.sm }}>
          <DraftScreenshots images={screenshots} onChange={setScreenshots} />
          <View style={[styles.replyRow, { gap: space.sm }]}>
            <HeaderIconButton
              label="Add screenshot"
              onPress={addScreenshots.add}
            >
              <View
                style={{
                  opacity:
                    addScreenshots.reason === undefined ? 1 : opacity.disabled,
                }}
              >
                <ImageIcon
                  color={
                    addScreenshots.reason === undefined
                      ? colors.text
                      : colors.muted
                  }
                  size={20}
                />
              </View>
            </HeaderIconButton>
            <TextInput
              accessibilityLabel="Reply"
              placeholder="Reply"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={messageMaxLength}
              editable={!muted}
              value={message}
              onPressIn={() => {
                if (unavailableReason !== undefined) {
                  notifyFailure(unavailableReason);
                }
              }}
              onChangeText={(value) => {
                dismissNotification();
                setMessage(value);
              }}
              style={[
                styles.replyInput,
                text.input,
                {
                  minHeight: size.input,
                  maxHeight: size.input * replyMaxRows,
                  paddingHorizontal: space.md,
                  paddingVertical: space.sm,
                  borderRadius: radius.control,
                  borderColor: colors.border,
                  backgroundColor: colors.raised,
                  color: colors.text,
                  opacity: muted ? opacity.dimmed : 1,
                },
              ]}
            />
            <View style={[styles.send, { height: size.input }]}>
              <Button
                label="Send"
                waitingLabel="Sending"
                compact
                waiting={reply.isPending}
                muted={muted || message.trim() === ''}
                onPress={() => void send()}
              />
            </View>
          </View>
        </View>
      </BottomActionBox>
      {guard.sheet}
    </>
  );
}

// About a short message with its heading.
const messageSkeletonHeight = 120;

/** A long reply grows to this many lines, then scrolls. */
const replyMaxRows = 3;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
  },
  messageHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  square: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  send: {
    justifyContent: 'center',
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    textAlignVertical: 'center',
  },
});
