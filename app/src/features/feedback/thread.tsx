import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';

import { ApiProblemError } from '@/api/problem';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { HeaderIconButton } from '@/components/header-icon-button';
import { AlertIcon, ImageIcon } from '@/components/icons';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { Skeleton } from '@/components/skeleton';
import { Tappable } from '@/components/tappable';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { photoUri } from '@/features/settings/use-user-photo';
import { formatRelativeTime } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { messageMaxLength } from './new-feedback-screen';
import {
  DraftScreenshots,
  ScreenshotGrid,
  useAddScreenshots,
} from './screenshot-field';
import {
  useScreenshot,
  type MessageDraft,
  type ThreadReader,
  type TicketMessage,
} from './use-feedback';

const minuteMs = 60_000;

/** The time now, a minute at a time, so "5 minutes ago" keeps up. */
export function useMinuteClock() {
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

/**
 * Keeps a thread's latest message in sight. Opening the keyboard to reply scrolls to the end, above it.
 * A sent message can show before or after the send finishes, so it scrolls at once and again when the thread next grows.
 */
export function useScrollToNew() {
  const ref = useRef<ScrollViewInstance>(null);
  const following = useRef(false);

  // The reply is the page's only field, so the keyboard opens only for it.
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      ref.current?.scrollToEnd({ animated: true });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    ref,
    onContentSizeChange: () => {
      if (following.current) {
        following.current = false;
        ref.current?.scrollToEnd({ animated: true });
      }
    },
    follow: () => {
      following.current = true;
      ref.current?.scrollToEnd({ animated: true });
    },
  };
}

/** A message. The reader's own stand out on a raised card with the accent's border. */
export function MessageCard({
  ticketId,
  message,
  reader,
  author,
  now,
  onOpen,
}: {
  ticketId: string;
  message: TicketMessage;
  reader: ThreadReader;
  /** How the message is headed, for example "You" or the sender's name. */
  author: string;
  now: Date;
  onOpen: (image: string) => void;
}) {
  const { colors, radius, space, text } = useTheme();
  const own = message.author === reader;

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
        <Text style={text.eyebrow}>{author}</Text>
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
              reader={reader}
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
  reader,
  onOpen,
}: {
  ticketId: string;
  id: string;
  number: number;
  reader: ThreadReader;
  onOpen: (image: string) => void;
}) {
  const { colors, radius } = useTheme();
  const image = useScreenshot(ticketId, id, reader);
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
    <View style={[tile, styles.clipped]}>
      <Skeleton width="100%" height="100%" />
    </View>
  );
}

/** Message cards in the shape of a thread while it loads. */
export function ThreadSkeleton({ label }: { label: string }) {
  const { space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={{ gap: space.md }}
    >
      <Skeleton width="100%" height={messageSkeletonHeight} />
      <Skeleton width="100%" height={messageSkeletonHeight} />
    </View>
  );
}

/** The reply box in one row: add screenshots, the reply, Send. It looks muted and says why when it can't be used. */
export function ReplyBox({
  send,
  sending,
  unavailableReason,
  closedMessage,
  onSent,
}: {
  send: (reply: MessageDraft) => Promise<void>;
  sending: boolean;
  unavailableReason?: string;
  /** What a reply to a ticket closed meanwhile says. */
  closedMessage: string;
  /** After a reply is sent, for example to show it. */
  onSent: () => void;
}) {
  const { colors, opacity, radius, size, space, text } = useTheme();
  const [message, setMessage] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const guard = useLeaveGuard(message.trim() !== '' || screenshots.length > 0);
  const addScreenshots = useAddScreenshots(
    screenshots,
    setScreenshots,
    unavailableReason,
  );
  const muted = unavailableReason !== undefined;

  async function submit() {
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
      await send({ message, screenshots });
      setMessage('');
      setScreenshots([]);
      Keyboard.dismiss();
      onSent();
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
                  maxHeight: size.input + replyLineHeight * (replyMaxRows - 1),
                  lineHeight: replyLineHeight,
                  // One line fills the field exactly, so it lines up with the buttons beside it.
                  paddingVertical: (size.input - 2 - replyLineHeight) / 2,
                  paddingHorizontal: space.md,
                  borderRadius: radius.control,
                  borderColor: colors.border,
                  backgroundColor: colors.raised,
                  color: colors.text,
                  opacity: muted ? opacity.dimmed : 1,
                },
              ]}
            />
            <Button
              label="Send"
              waitingLabel="Sending"
              fieldHeight
              waiting={sending}
              muted={muted || message.trim() === ''}
              onPress={() => void submit()}
            />
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

/** The reply's line height, which sets the field's padding. */
const replyLineHeight = 20;

const styles = StyleSheet.create({
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
  clipped: {
    overflow: 'hidden',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    textAlignVertical: 'center',
  },
});
