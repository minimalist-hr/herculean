import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';

import { toFormErrors } from '@/api/problem';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { ScreenHeading } from '@/components/screen-heading';
import { TextField } from '@/components/text-field';
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
  const scrollView = useRef<ScrollViewInstance>(null);
  // An expired link in an email opens this screen with this line, so the user can send a new one.
  const [generalError, setGeneralError] = useState(
    linkExpired === 'true'
      ? 'This link has expired. Send a new one.'
      : undefined,
  );
  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: emptyValues,
  });
  const { errors } = formState;

  // The general error sits above the first field, so the form scrolls up to show it.
  useEffect(() => {
    if (generalError !== undefined) {
      scrollView.current?.scrollTo({ y: 0 });
    }
  }, [generalError]);

  const submit = handleSubmit(async ({ email }) => {
    setGeneralError(undefined);
    try {
      await sendResetLink.mutateAsync(email);
      router.push({ pathname: '/reset-link-sent', params: { email } });
    } catch (error) {
      const formErrors = toFormErrors(error, ['email']);
      if (formErrors.fields.email !== undefined) {
        setError('email', { message: formErrors.fields.email });
      }
      if (formErrors.general) {
        setGeneralError("Couldn't send the link. Try again.");
      }
    }
  });

  const waiting = sendResetLink.isPending;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Only the form makes room for the keyboard. The actions stay behind it until it closes. */}
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          ref={scrollView}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: space.xl,
            paddingTop: size.topPaddingTab,
            paddingHorizontal: size.sidePadding,
            paddingBottom: space.lg,
          }}
        >
          <ScreenHeading
            label="Forgot password?"
            title="Reset password"
            subtitle="We’ll email you a link to set a new password."
          />

          <View style={{ gap: space.lg }}>
            {generalError !== undefined && <FormError message={generalError} />}
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <TextField
                  ref={field.ref}
                  label="Email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="go"
                  onSubmitEditing={() => void submit()}
                  value={field.value}
                  onChangeText={(value) => {
                    setGeneralError(undefined);
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
        <Button
          label="Cancel"
          variant="secondary"
          dimmed={waiting}
          onPress={() => {
            // A link in an email can open this page with nothing behind it, so it doesn't just go back.
            router.dismissTo('/sign-in');
          }}
        />
      </BottomActionBox>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
