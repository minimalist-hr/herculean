import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { toFormErrors } from '@/api/problem';
import { BackLink } from '@/components/back-link';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { ScreenHeading } from '@/components/screen-heading';
import { TextField } from '@/components/text-field';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { useTheme } from '@/theme/theme-provider';

import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from './reset-password-schema';
import { useSendResetLink } from './use-send-reset-link';

const emptyValues: ResetPasswordValues = { email: '' };

export function ResetPasswordScreen() {
  const { colors, size, space } = useTheme();
  const router = useRouter();
  const { linkExpired } = useLocalSearchParams<{ linkExpired?: string }>();
  const sendResetLink = useSendResetLink();
  useEffect(() => {
    if (linkExpired === 'true') {
      notifyFailure('This link has expired. Send a new one.');
    }
  }, [linkExpired]);

  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: emptyValues,
  });
  const { errors } = formState;
  const guard = useLeaveGuard(formState.isDirty);

  const submit = handleSubmit(async ({ email }) => {
    dismissNotification();
    // Once sent, nothing is left to lose, and later pages can leave past this one.
    guard.allow();
    try {
      await sendResetLink.mutateAsync(email);
      router.push({ pathname: '/reset-link-sent', params: { email } });
    } catch (error) {
      guard.block();
      const formErrors = toFormErrors(error, ['email']);
      if (formErrors.fields.email !== undefined) {
        setError('email', { message: formErrors.fields.email });
      }
      if (formErrors.general) {
        notifyFailure("Couldn't send the link. Try again.");
      }
    }
  });

  const waiting = sendResetLink.isPending;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Only the form makes room for the keyboard. The actions stay behind it until it closes. */}
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: space.xl,
            paddingTop: size.topPaddingSubPage,
            paddingHorizontal: size.sidePadding,
            paddingBottom: space.lg,
          }}
        >
          <View style={{ gap: 2 }}>
            <BackLink
              label="Sign in"
              onPress={() => {
                // A link in an email can open this page with nothing behind it, so it doesn't just go back.
                router.dismissTo('/sign-in');
              }}
            />
            <ScreenHeading
              title="Reset password"
              subtitle="We’ll email you a link to set a new password."
            />
          </View>

          <View style={{ gap: space.lg }}>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <TextField
                  ref={field.ref}
                  label="Email"
                  autoComplete="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="go"
                  onSubmitEditing={() => void submit()}
                  value={field.value}
                  onChangeText={(value) => {
                    dismissNotification();
                    field.onChange(value);
                  }}
                  onBlur={field.onBlur}
                  error={errors.email?.message}
                />
              )}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBox>
        <Button
          label="Send reset link"
          waitingLabel="Sending reset link"
          waiting={waiting}
          onPress={() => void submit()}
        />
      </BottomActionBox>
      {guard.sheet}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
