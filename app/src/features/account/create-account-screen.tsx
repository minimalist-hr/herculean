import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { toFormErrors } from '@/api/problem';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { ScreenHeading } from '@/components/screen-heading';
import { TextField } from '@/components/text-field';
import { TextLink } from '@/components/text-link';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { useTheme } from '@/theme/theme-provider';

import {
  createAccountSchema,
  type CreateAccountValues,
} from './create-account-schema';
import { useCreateAccount } from './use-create-account';

const emptyValues: CreateAccountValues = {
  email: '',
  password: '',
  repeatPassword: '',
};

export function CreateAccountScreen() {
  const { colors, size, space, text } = useTheme();
  const router = useRouter();
  const createAccount = useCreateAccount();
  const { control, handleSubmit, setError, setFocus, formState } = useForm({
    resolver: zodResolver(createAccountSchema),
    defaultValues: emptyValues,
  });
  const { errors } = formState;
  const guard = useLeaveGuard(formState.isDirty);

  const submit = handleSubmit(async ({ email, password }) => {
    dismissNotification();
    guard.allow();
    try {
      // Signed in now, so the app moves on to setup.
      await createAccount.mutateAsync({ email, password });
    } catch (error) {
      guard.block();
      const formErrors = toFormErrors(error, ['email', 'password'], {
        'user.email_taken': 'email',
      });
      for (const [field, message] of Object.entries(formErrors.fields)) {
        setError(field as 'email' | 'password', { message });
      }
      if (formErrors.general) {
        notifyFailure("Couldn't create the account. Try again.");
      }
    }
  });

  // Typing again clears the general error.
  function changeText(onChange: (value: string) => void) {
    return (value: string) => {
      dismissNotification();
      onChange(value);
    };
  }

  const waiting = createAccount.isPending;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Only the form makes room for the keyboard. The actions stay behind it until it closes. */}
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: space.xl,
            paddingTop: size.topPaddingTab,
            paddingHorizontal: size.sidePadding,
            paddingBottom: space.lg,
          }}
        >
          <ScreenHeading
            label="Welcome to Herculean"
            title="Create account"
            subtitle="Email and password. Everything else comes next."
          />

          <View style={{ gap: space.lg }}>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <TextField
                  ref={field.ref}
                  label="Email"
                  placeholder="Your email"
                  autoComplete="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => {
                    setFocus('password');
                  }}
                  value={field.value}
                  onChangeText={changeText(field.onChange)}
                  onBlur={field.onBlur}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <TextField
                  ref={field.ref}
                  label="Password"
                  placeholder="Choose a password"
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
                  label="Confirm password"
                  placeholder="Confirm password"
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

          <Text style={text.meta}>
            By creating an account you agree to the{' '}
            <Text
              accessibilityRole="link"
              style={[styles.link, { color: colors.primaryText }]}
              onPress={() => {
                router.push('/terms');
              }}
            >
              Terms of service
            </Text>{' '}
            and the{' '}
            <Text
              accessibilityRole="link"
              style={[styles.link, { color: colors.primaryText }]}
              onPress={() => {
                router.push('/privacy');
              }}
            >
              Privacy policy
            </Text>
            .
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBox>
        <Button
          label="Create account"
          waitingLabel="Creating account"
          waiting={waiting}
          onPress={() => void submit()}
        />
        <View style={styles.otherAction}>
          <Text style={[text.body, { color: colors.muted }]}>
            Already have an account?
          </Text>
          <TextLink
            label="Sign in"
            dimmed={waiting}
            onPress={() => {
              // Sign in usually opened this page, so it goes back to it.
              router.dismissTo('/sign-in');
            }}
          />
        </View>
      </BottomActionBox>
      {guard.sheet}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  link: {
    textDecorationLine: 'underline',
  },
  otherAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
