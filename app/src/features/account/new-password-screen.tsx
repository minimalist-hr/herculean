import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ApiProblemError, toFormErrors } from '@/api/problem';
import { BackLink } from '@/components/back-link';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { ScreenHeading } from '@/components/screen-heading';
import { TextField } from '@/components/text-field';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { useTheme } from '@/theme/theme-provider';

import {
  newPasswordSchema,
  type NewPasswordValues,
} from './new-password-schema';
import { useSaveNewPassword } from './use-save-new-password';

const emptyValues: NewPasswordValues = { password: '', repeatPassword: '' };

export function NewPasswordScreen() {
  const { token, email } = useLocalSearchParams<{
    token?: string;
    email?: string;
  }>();

  if (token === undefined) {
    return <Redirect href="/forgot-password?linkExpired=true" />;
  }

  return <NewPasswordForm token={token} email={email} />;
}

function NewPasswordForm({ token, email }: { token: string; email?: string }) {
  const { colors, size, space } = useTheme();
  const router = useRouter();
  const saveNewPassword = useSaveNewPassword();
  const { control, handleSubmit, setError, setFocus, formState } = useForm({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: emptyValues,
  });
  const { errors } = formState;

  const submit = handleSubmit(async ({ password }) => {
    dismissNotification();
    try {
      await saveNewPassword.mutateAsync({ token, password });
      notifySuccess('Password changed. Sign in with the new one.');
      goToSignIn();
    } catch (error) {
      if (
        error instanceof ApiProblemError &&
        error.problem.code === 'user.invalid_password_reset_token'
      ) {
        notifyFailure(error.problem.detail);
        return;
      }

      const formErrors = toFormErrors(error, ['password']);
      if (formErrors.fields.password !== undefined) {
        setError('password', { message: formErrors.fields.password });
      }
      if (formErrors.general) {
        notifyFailure('Couldn’t save the password. Try again.');
      }
    }
  });

  // A link in an email opens this page with nothing behind it, so it doesn't just go back.
  function goToSignIn() {
    router.dismissTo('/sign-in');
  }

  // Typing again clears the general error.
  function changeText(onChange: (value: string) => void) {
    return (value: string) => {
      dismissNotification();
      onChange(value);
    };
  }

  const waiting = saveNewPassword.isPending;

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
          <View style={{ gap: space.xxxs }}>
            <BackLink label="Sign in" onPress={goToSignIn} />
            <ScreenHeading
              title="New password"
              subtitle={email === undefined ? undefined : `For ${email}.`}
            />
          </View>

          <View style={{ gap: space.lg }}>
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <TextField
                  ref={field.ref}
                  label="New password"
                  autoComplete="new-password"
                  password
                  helper="At least 8 characters."
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => {
                    setFocus('repeatPassword');
                  }}
                  value={field.value}
                  onChangeText={changeText(field.onChange)}
                  onBlur={field.onBlur}
                  error={errors.password?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="repeatPassword"
              render={({ field }) => (
                <TextField
                  ref={field.ref}
                  label="Confirm new password"
                  autoComplete="new-password"
                  password
                  returnKeyType="go"
                  onSubmitEditing={() => void submit()}
                  value={field.value}
                  onChangeText={changeText(field.onChange)}
                  onBlur={field.onBlur}
                  error={errors.repeatPassword?.message}
                />
              )}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBox>
        <Button
          label="Save password"
          waitingLabel="Saving password"
          waiting={waiting}
          onPress={() => void submit()}
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
