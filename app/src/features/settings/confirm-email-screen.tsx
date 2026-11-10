import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ApiProblemError } from '@/api/problem';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { EmptyCard } from '@/components/empty-card';
import { LoadFailure } from '@/components/load-failure';
import { notifySuccess } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { Skeleton } from '@/components/skeleton';
import { useSessionStatus } from '@/features/account/session';
import { useTheme } from '@/theme/theme-provider';

import { useConfirmEmailChange } from './use-email-change';

const expired = {
  title: 'Link expired',
  message: 'This link has expired. Send a new one.',
};

const expiredSignedOut =
  'This link has expired. Sign in and send a new one from Profile.';

/** What to say when the link won't work again, so trying again can't help. */
function linkProblemOf(error: unknown) {
  if (!(error instanceof ApiProblemError)) {
    return null;
  }

  switch (error.problem.code) {
    case 'user.invalid_email_change_token':
      return expired;
    case 'user.email_taken':
      return { title: 'Email taken', message: error.problem.detail };
    default:
      return null;
  }
}

/** The screen a link in the email opens. It works signed in, signed out and from a closed app. */
export function ConfirmEmailScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const status = useSessionStatus();
  const confirm = useConfirmEmailChange();
  const sent = useRef(false);

  // The token works once, so it is sent once however often the effect runs.
  useEffect(() => {
    if (token && !sent.current) {
      sent.current = true;
      confirm.mutate(token);
    }
  }, [token, confirm]);

  const confirmed = confirm.isSuccess;
  useEffect(() => {
    if (!confirmed) {
      return;
    }

    if (status === 'signedOut') {
      router.replace('/sign-in');
      notifySuccess('Email changed. Sign in with the new one.');
    } else {
      router.replace(status === 'ready' ? '/settings' : '/launch');
      notifySuccess('Email changed.');
    }
  }, [confirmed, status, router]);

  const leave = (
    <Button
      label={status === 'signedOut' ? 'Go to sign in' : 'Back to Profile'}
      onPress={() => {
        router.replace(status === 'signedOut' ? '/sign-in' : '/settings');
      }}
    />
  );

  const linkProblem = token ? linkProblemOf(confirm.error) : expired;
  if (linkProblem !== null) {
    return (
      <Page title={linkProblem.title} action={leave}>
        <EmptyCard
          message={
            linkProblem === expired && status === 'signedOut'
              ? expiredSignedOut
              : linkProblem.message
          }
        />
      </Page>
    );
  }

  if (confirm.isError) {
    return (
      <Page title="Confirm email" action={leave}>
        <LoadFailure
          message="Couldn’t confirm your email."
          onRetry={() => {
            if (token) {
              confirm.mutate(token);
            }
          }}
        />
      </Page>
    );
  }

  return (
    <Page title="Confirming email">
      <View
        accessible
        accessibilityLabel="Loading"
        accessibilityLiveRegion="polite"
      >
        <Skeleton width={220} height={14} />
      </View>
    </Page>
  );
}

function Page({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { colors, size, space } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          gap: space.xl,
          paddingTop: size.topPaddingTab,
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.lg,
        }}
      >
        <ScreenHeading title={title} />
        {children}
      </ScrollView>
      {action !== undefined && <BottomActionBox>{action}</BottomActionBox>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
