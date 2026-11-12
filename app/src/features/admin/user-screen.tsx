import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePageEnd } from '@/components/above-tab-bar';
import { BackLink } from '@/components/back-link';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyCard } from '@/components/empty-card';
import { AlertIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { usePullToRefresh } from '@/components/pull-to-refresh';
import { blankLine, ScreenHeading } from '@/components/screen-heading';
import { SectionTitle } from '@/components/section-title';
import { Sheet } from '@/components/sheet';
import { notLoadedMessage } from '@/features/feedback/feedback-labels';
import { useMinuteClock } from '@/features/feedback/thread';
import {
  TicketList,
  TicketListSkeleton,
  TicketRow,
} from '@/features/feedback/ticket-rows';
import {
  SettingsRow,
  SettingsSection,
} from '@/features/settings/settings-rows';
import {
  formatLocalDate,
  formatNumber,
  formatRelativeTime,
  noValue,
} from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { useFeedbackBlock, useSetFeedbackBlock } from './use-feedback-block';
import { UserAvatar } from './user-avatar';
import { deletesOnText, nameOf } from './user-rows';
import {
  useAdminUser,
  useUserAction,
  useUserTickets,
  useUserTraining,
  type UserAction,
} from './use-users';

/** What each action asks first, and what it says once done. */
/** Every action on the page: the account's, and blocking feedback. */
type PageAction = UserAction | 'blockFeedback' | 'unblockFeedback';

const actions: Record<
  PageAction,
  {
    label: string;
    waitingLabel: string;
    title: string;
    message: string;
    done: string;
    danger?: boolean;
  }
> = {
  removePhoto: {
    label: 'Remove photo',
    waitingLabel: 'Removing photo',
    title: 'Remove their photo?',
    message: 'It’s deleted, and they get an email saying why.',
    done: 'Photo removed.',
    danger: true,
  },
  blockFeedback: {
    label: 'Block feedback',
    waitingLabel: 'Blocking',
    title: 'Block their feedback?',
    message:
      'They can read their tickets but can’t send feedback or reply. They aren’t told until they try.',
    done: 'Feedback blocked.',
    danger: true,
  },
  unblockFeedback: {
    label: 'Unblock feedback',
    waitingLabel: 'Unblocking',
    title: 'Unblock their feedback?',
    message: 'They can send feedback and reply again.',
    done: 'Feedback unblocked.',
  },
  signOut: {
    label: 'Sign out all devices',
    waitingLabel: 'Signing out',
    title: 'Sign out all devices?',
    message: 'They’ll need to sign in again on every phone.',
    done: 'Signed out of every device.',
  },
  sendResetLink: {
    label: 'Send reset link',
    waitingLabel: 'Sending',
    title: 'Send a reset link?',
    message:
      'An email goes to their address with a link to set a new password.',
    done: 'Reset link sent.',
  },
  cancelDeletion: {
    label: 'Cancel deletion',
    waitingLabel: 'Cancelling',
    title: 'Cancel the deletion?',
    message: 'The account stays as it was, and a closed one can sign in again.',
    done: 'Deletion cancelled.',
  },
  closeAccount: {
    label: 'Close account',
    waitingLabel: 'Closing account',
    title: 'Close this account?',
    message:
      'They’re signed out and can’t sign in. Everything is deleted in 14 days unless you cancel.',
    done: 'Account closed.',
    danger: true,
  },
};

/** A user's account for the admin: when they joined and were last active, counts, feedback and support actions. */
export function UserScreen({
  openTicket,
}: {
  /** Opens one of their tickets, with the user's name as its back link. */
  openTicket: (ticketId: string, back: string) => void;
}) {
  const router = useRouter();
  const { id, back } = useLocalSearchParams<{ id: string; back?: string }>();
  const { colors, size, space, text } = useTheme();
  const now = useMinuteClock();
  const pageEnd = usePageEnd();
  const user = useAdminUser(id);
  const training = useUserTraining(id);
  const tickets = useUserTickets(id);
  const action = useUserAction(id);
  const block = useFeedbackBlock(id);
  const setBlock = useSetFeedbackBlock(id);
  const blocked = block.data?.blocked;
  // Kept after the sheet closes, so its words stay while it slides away.
  const [asking, setAsking] = useState<PageAction>('signOut');
  const [confirming, setConfirming] = useState(false);
  const refreshControl = usePullToRefresh(() =>
    Promise.all([
      user.refetch(),
      training.refetch(),
      tickets.refetch(),
      block.refetch(),
    ]),
  );
  const deleting = user.data?.deletionScheduledForUtc ?? null;

  function ask(next: PageAction) {
    if (user.data === undefined) {
      notifyFailure(notLoadedMessage);
      return;
    }

    dismissNotification();
    setAsking(next);
    setConfirming(true);
  }

  async function confirm(current: PageAction) {
    dismissNotification();
    try {
      if (current === 'blockFeedback' || current === 'unblockFeedback') {
        await setBlock.mutateAsync(current === 'blockFeedback');
      } else {
        await action.mutateAsync(current);
      }
      notifySuccess(actions[current].done);
    } catch {
      notifyFailure('Couldn’t do that. Try again.');
    } finally {
      setConfirming(false);
    }
  }

  function blockValue() {
    if (block.data !== undefined) {
      return block.data.blocked ? 'Blocked' : 'Allowed';
    }

    return block.isLoadingError ? noValue : undefined;
  }

  function trainingValue(count: 'workouts' | 'routines') {
    if (training.data !== undefined) {
      return formatNumber(training.data[count]);
    }

    return training.isLoadingError ? noValue : undefined;
  }

  function renderDetails() {
    if (user.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load this user."
          onRetry={() => {
            void user.refetch();
          }}
        />
      );
    }

    const { data } = user;

    return (
      <View style={{ gap: space.md }}>
        <SettingsSection>
          <SettingsRow
            first
            label="Joined"
            value={
              data === undefined
                ? undefined
                : formatLocalDate(data.createdAtUtc)
            }
          />
          <SettingsRow
            label="Last active"
            value={
              data === undefined
                ? undefined
                : data.lastActiveAtUtc === null
                  ? 'Never'
                  : formatRelativeTime(data.lastActiveAtUtc, now)
            }
          />
          <SettingsRow label="Workouts" value={trainingValue('workouts')} />
          <SettingsRow label="Routines" value={trainingValue('routines')} />
          <SettingsRow label="Feedback" value={blockValue()} />
        </SettingsSection>
        {training.isLoadingError && (
          <LoadFailure
            message="Couldn’t load their counts."
            onRetry={() => {
              void training.refetch();
            }}
          />
        )}
      </View>
    );
  }

  function renderFeedback() {
    if (tickets.data !== undefined) {
      if (tickets.data.length === 0) {
        return <EmptyCard message="No feedback from this user" />;
      }

      return (
        <TicketList>
          {tickets.data.map((ticket, index) => (
            <TicketRow
              key={ticket.id}
              type={ticket.type}
              status={ticket.status}
              preview={ticket.preview}
              lastMessageAtUtc={ticket.lastMessageAtUtc}
              dot={ticket.waitingForReply ? 'waiting for a reply' : undefined}
              high={ticket.priority === 'high'}
              first={index === 0}
              onPress={() => {
                openTicket(
                  ticket.id,
                  user.data === undefined ? 'User' : nameOf(user.data),
                );
              }}
            />
          ))}
        </TicketList>
      );
    }

    if (tickets.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load their feedback."
          onRetry={() => {
            void tickets.refetch();
          }}
        />
      );
    }

    return <TicketListSkeleton label="Loading their feedback" />;
  }

  const muted = user.data === undefined;

  return (
    <>
      <ScrollView
        testID="user-scroll"
        style={[styles.screen, { backgroundColor: colors.bg }]}
        refreshControl={refreshControl}
        contentContainerStyle={{
          gap: space.xl,
          paddingTop: size.topPaddingSubPage,
          paddingHorizontal: size.sidePadding,
          paddingBottom: pageEnd,
        }}
      >
        <View style={{ gap: space.xxxs }}>
          <BackLink
            label={back ?? 'Users'}
            onPress={() => {
              router.back();
            }}
          />
          <View style={[styles.line, { gap: space.md }]}>
            <UserAvatar user={user.data} size={size.userPageAvatar} />
            <View style={styles.heading}>
              <ScreenHeading
                title={user.data === undefined ? null : nameOf(user.data)}
                subtitle={user.data?.name == null ? blankLine : user.data.email}
              />
            </View>
          </View>
        </View>
        {deleting !== null && (
          <Card>
            <View style={[styles.line, { gap: space.sm }]}>
              <AlertIcon color={colors.warn} size={16} />
              <Text style={[text.body, { color: colors.warn }]}>
                {deletesOnText(deleting, user.data?.closed === true)}
              </Text>
            </View>
          </Card>
        )}
        {renderDetails()}
        <View style={{ gap: space.sm }}>
          <SectionTitle>
            {tickets.data === undefined
              ? 'Feedback'
              : `Feedback · ${String(tickets.data.length)}`}
          </SectionTitle>
          {renderFeedback()}
        </View>
        <SettingsSection>
          {user.data?.hasPhoto === true && (
            <SettingsRow
              first
              label={actions.removePhoto.label}
              hasValue={false}
              onPress={() => {
                ask('removePhoto');
              }}
            />
          )}
          <SettingsRow
            first={user.data?.hasPhoto !== true}
            label={
              blocked === true
                ? actions.unblockFeedback.label
                : actions.blockFeedback.label
            }
            hasValue={false}
            muted={muted || blocked === undefined}
            onPress={() => {
              if (blocked === undefined) {
                notifyFailure(notLoadedMessage);
                return;
              }

              ask(blocked ? 'unblockFeedback' : 'blockFeedback');
            }}
          />
          <SettingsRow
            label={actions.signOut.label}
            hasValue={false}
            muted={muted}
            onPress={() => {
              ask('signOut');
            }}
          />
          <SettingsRow
            label={actions.sendResetLink.label}
            hasValue={false}
            muted={muted}
            onPress={() => {
              ask('sendResetLink');
            }}
          />
          {deleting === null ? (
            <SettingsRow
              label={actions.closeAccount.label}
              hasValue={false}
              danger
              muted={muted}
              onPress={() => {
                ask('closeAccount');
              }}
            />
          ) : (
            <SettingsRow
              label={actions.cancelDeletion.label}
              hasValue={false}
              onPress={() => {
                ask('cancelDeletion');
              }}
            />
          )}
        </SettingsSection>
      </ScrollView>
      <Sheet
        visible={confirming}
        title={actions[asking].title}
        message={actions[asking].message}
        onClose={() => {
          setConfirming(false);
        }}
      >
        <Button
          label={actions[asking].label}
          waitingLabel={actions[asking].waitingLabel}
          variant={actions[asking].danger === true ? 'danger' : 'primary'}
          waiting={action.isPending || setBlock.isPending}
          onPress={() => void confirm(asking)}
        />
      </Sheet>
    </>
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
  heading: {
    flex: 1,
  },
});
