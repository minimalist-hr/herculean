import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { toFormErrors } from '@/api/problem';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { ScreenHeading } from '@/components/screen-heading';
import { TextField } from '@/components/text-field';
import { TextLink } from '@/components/text-link';
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
  const scrollView = useRef<ScrollViewInstance>(null);
  const [generalError, setGeneralError] = useState(false);
  const { control, handleSubmit, setError, setFocus, formState } = useForm({
    resolver: zodResolver(createAccountSchema),
    defaultValues: emptyValues,
  });
  const { errors } = formState;

  // The general error sits above the first field, so the form scrolls up to show it.
  useEffect(() => {
    if (generalError) {
      scrollView.current?.scrollTo({ y: 0 });
    }
  }, [generalError]);

  const submit = handleSubmit(async ({ email, password }) => {
    setGeneralError(false);
    try {
      // Signed in now, so the app moves on to setup.
      await createAccount.mutateAsync({ email, password });
    } catch (error) {
      const formErrors = toFormErrors(error, ['email', 'password'], {
        'user.email_taken': 'email',
      });
      for (const [field, message] of Object.entries(formErrors.fields)) {
        setError(field as 'email' | 'password', { message });
      }
      setGeneralError(formErrors.general);
    }
  });

  // Typing again clears the general error.
  function changeText(onChange: (value: string) => void) {
    return (value: string) => {
      setGeneralError(false);
      onChange(value);
    };
  }

  const waiting = createAccount.isPending;

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
            label="Welcome to Herculean"
            title="Create account"
            subtitle="Email and password. Everything else comes next."
          />

          <View style={{ gap: space.lg }}>
            {generalError && (
              <FormError message="Couldn't create the account. Try again." />
            )}
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
                  label="Repeat password"
                  placeholder="Type it again"
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
