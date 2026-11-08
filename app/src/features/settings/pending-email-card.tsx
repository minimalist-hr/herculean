import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { useCountdown } from '@/features/account/use-countdown';
import { formatClock } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import {
  usePendingEmailChange,
  useResendEmailChange,
} from './use-email-change';

const sendAgainWaitSeconds = 60;

/** Above the email form while a link waits to be opened. Nothing shows without one, or when it can't load. */
export function PendingEmailCard() {
  const pending = usePendingEmailChange();
  const newEmail = pending.data?.newEmail;

  return newEmail ? <Card newEmail={newEmail} /> : null;
}

function Card({ newEmail }: { newEmail: string }) {
  const { colors, radius, space, text } = useTheme();
  const resend = useResendEmailChange();
  const { secondsLeft, restart } = useCountdown(sendAgainWaitSeconds, 0);
  const waiting = secondsLeft > 0;

  function sendAgain() {
    if (waiting) {
      notifyFailure('Wait a moment before sending it again.');
      return;
    }

    dismissNotification();
    resend.mutate(undefined, {
      onSuccess: () => {
        notifySuccess('Link sent again.');
        restart();
      },
      onError: () => {
        notifyFailure("Couldn't send the link. Try again.");
      },
    });
  }

  return (
    <View
      style={[
        styles.card,
        {
          gap: space.md,
          padding: space.lg,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View style={{ gap: space.sm }}>
        <Text style={[text.listItemName, { color: colors.text }]}>
          Waiting for confirmation
        </Text>
        <Text style={text.meta}>
          We sent a link to {newEmail}. Open it on the phone with Herculean to
          start using this address.
        </Text>
      </View>
      <Button
        label={
          waiting
            ? `Send link again in ${formatClock(secondsLeft)}`
            : 'Send link again'
        }
        waitingLabel="Sending link"
        variant="secondary"
        waiting={resend.isPending}
        muted={waiting}
        onPress={sendAgain}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
