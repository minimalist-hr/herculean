import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackLink } from '@/components/back-link';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { formatClock } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { useCountdown } from './use-countdown';
import { useSendResetLink } from './use-send-reset-link';

// Long enough for an email to arrive, and it keeps people from sending link after link.
const sendAgainWaitSeconds = 60;

export function ResetLinkSentScreen() {
  const { cardLine, colors, radius, size, space, text } = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const sendResetLink = useSendResetLink();
  const { secondsLeft, restart } = useCountdown(sendAgainWaitSeconds);

  function sendAgain() {
    if (secondsLeft > 0) {
      notifyFailure('Wait a moment before sending it again.');
      return;
    }

    dismissNotification();
    sendResetLink.mutate(email, {
      onSuccess: () => {
        notifySuccess('Link sent again.');
        restart();
      },
      onError: () => {
        notifyFailure('Couldn’t send the link. Try again.');
      },
    });
  }

  const waiting = sendResetLink.isPending;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          gap: space.xl,
          paddingTop: size.topPaddingSubPage,
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.lg,
        }}
      >
        <View style={{ gap: space.xxxs }}>
          <BackLink
            label="Sign in"
            onPress={() => {
              router.dismissTo('/sign-in');
            }}
          />
          <ScreenHeading title="Check your email" />
        </View>

        <View style={{ gap: space.lg }}>
          <View
            style={[
              styles.card,
              {
                borderWidth: cardLine,
                gap: space.sm,
                padding: space.lg,
                borderRadius: radius.card,
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Text style={[text.listItemName, { color: colors.text }]}>
              Reset link sent to {email}
            </Text>
            <Text style={text.meta}>
              Open the link on this phone to set a new password. It works for
              one hour. Can’t find it? Check your spam folder.
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomActionBox>
        <Button
          label={
            secondsLeft > 0
              ? `Send link again in ${formatClock(secondsLeft)}`
              : 'Send link again'
          }
          waitingLabel="Sending link"
          variant="secondary"
          waiting={waiting}
          muted={secondsLeft > 0}
          onPress={sendAgain}
        />
      </BottomActionBox>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  card: {},
});
