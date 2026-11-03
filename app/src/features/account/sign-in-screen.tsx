import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiProblemError } from '@/api/problem';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { Glow } from '@/components/glow';
import { ScreenHeading } from '@/components/screen-heading';
import { TextField } from '@/components/text-field';
import { TextLink } from '@/components/text-link';
import { Wordmark } from '@/components/wordmark';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { useTheme } from '@/theme/theme-provider';

import { signInSchema, type SignInValues } from './sign-in-schema';
import { useSignIn } from './use-sign-in';

const emptyValues: SignInValues = { email: '', password: '' };

export function SignInScreen() {
  const { colors, size, space, text } = useTheme();
  const router = useRouter();
  const signIn = useSignIn();
  const [heroHeight, setHeroHeight] = useState<number>();
  // It can be either field that's wrong, so both turn red and the message sits under the last.
  const [wrongCredentials, setWrongCredentials] = useState<string>();
  const { control, handleSubmit, setFocus, formState } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: emptyValues,
  });
  const { errors } = formState;

  const submit = handleSubmit(async (values) => {
    dismissNotification();
    try {
      // Signed in, so the app moves on to Home, or to setup if it is not done.
      await signIn.mutateAsync(values);
    } catch (error) {
      if (
        error instanceof ApiProblemError &&
        error.problem.code === 'user.invalid_credentials'
      ) {
        setWrongCredentials(error.problem.detail);
      } else {
        notifyFailure("Couldn't sign in. Try again.");
      }
    }
  });

  // Typing again clears the notification.
  function changeText(onChange: (value: string) => void) {
    return (value: string) => {
      setWrongCredentials(undefined);
      dismissNotification();
      onChange(value);
    };
  }

  // The leftover height less room for an error under each field, within the maximum, and never smaller than the logo.
  function fitHero(leftover: number) {
    const logoHeight = space.xl * 2 + (text.wordmark.lineHeight ?? 0);
    return Math.max(
      Math.min(leftover - size.signInErrorRoom, size.signInHeroMax),
      logoHeight,
    );
  }

  const waiting = signIn.isPending;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Only the form makes room for the keyboard. The actions stay behind it until it closes. */}
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {/* Takes the height the form leaves, minus room for its errors, so the screen fits without scrolling.
              That height is kept once measured: the keyboard then scrolls the screen instead of squeezing the logo. */}
          <View
            onLayout={(event) => {
              const leftover = event.nativeEvent.layout.height;
              setHeroHeight((measured) => measured ?? fitHero(leftover));
            }}
            style={[
              styles.hero,
              { paddingVertical: space.xl },
              heroHeight === undefined
                ? { flexGrow: 1 }
                : { height: heroHeight },
            ]}
          >
            <Glow radiusX={0.7} radiusY={0.55} fadeAt={0.9} />
            <Wordmark />
          </View>

          <View
            style={{
              gap: space.xl,
              paddingHorizontal: size.sidePadding,
              paddingBottom: space.lg,
            }}
          >
            <ScreenHeading title="Sign in" />

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
                    error={
                      errors.email?.message ??
                      (wrongCredentials === undefined ? undefined : '')
                    }
                  />
                )}
              />
              <View>
                <Controller
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <TextField
                      ref={field.ref}
                      label="Password"
                      placeholder="Your password"
                      autoComplete="current-password"
                      password
                      returnKeyType="go"
                      onSubmitEditing={() => void submit()}
                      value={field.value}
                      onChangeText={changeText(field.onChange)}
                      onBlur={field.onBlur}
                      error={errors.password?.message ?? wrongCredentials}
                    />
                  )}
                />
                <View
                  style={{ marginLeft: -space.sm, alignSelf: 'flex-start' }}
                >
                  <TextLink
                    label="Forgot password?"
                    dimmed={waiting}
                    onPress={() => {
                      router.push('/forgot-password');
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBox>
        <Button
          label="Sign in"
          waitingLabel="Signing in"
          waiting={waiting}
          onPress={() => void submit()}
        />
        <View style={styles.otherAction}>
          <Text style={[text.body, { color: colors.muted }]}>New here?</Text>
          <TextLink
            label="Create account"
            dimmed={waiting}
            onPress={() => {
              router.push('/create-account');
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
  content: {
    flexGrow: 1,
  },
  hero: {
    justifyContent: 'center',
    overflow: 'hidden',
  },
  otherAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
