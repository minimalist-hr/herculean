import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { toFormErrors } from '@/api/problem';
import { Button } from '@/components/button';
import { FormPage } from '@/components/form-page';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { TextField } from '@/components/text-field';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { newPasswordSchema } from '@/features/account/new-password-schema';
import { useTheme } from '@/theme/theme-provider';

import { useChangePassword } from './use-update-settings';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
  })
  .and(newPasswordSchema);

const emptyValues = { currentPassword: '', password: '', repeatPassword: '' };

export function ChangePasswordScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const changePassword = useChangePassword();
  const { control, handleSubmit, setError, setFocus, formState } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: emptyValues,
  });
  const { errors } = formState;
  const guard = useLeaveGuard(formState.isDirty);

  const submit = handleSubmit(async ({ currentPassword, password }) => {
    dismissNotification();
    guard.allow();
    try {
      await changePassword.mutateAsync({
        currentPassword,
        newPassword: password,
      });
      router.back();
      notifySuccess('Password saved. Other devices are signed out.');
    } catch (error) {
      guard.block();
      const formErrors = toFormErrors(error, [
        'currentPassword',
        'newPassword',
      ]);
      const { currentPassword: wrong, newPassword: rejected } =
        formErrors.fields;
      if (wrong !== undefined) {
        setError('currentPassword', { message: wrong });
      }
      if (rejected !== undefined) {
        setError('password', { message: rejected });
      }
      if (formErrors.general) {
        notifyFailure("Couldn't save the password. Try again.");
      }
    }
  });

  return (
    <>
      <FormPage
        back="Settings"
        title="Change password"
        subtitle="You'll be signed out of other devices."
        action={
          <Button
            label="Save password"
            waitingLabel="Saving password"
            waiting={changePassword.isPending}
            onPress={() => void submit()}
          />
        }
      >
        <View style={{ gap: space.lg }}>
          <Controller
            control={control}
            name="currentPassword"
            render={({ field }) => (
              <TextField
                ref={field.ref}
                label="Current password"
                autoComplete="current-password"
                password
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => {
                  setFocus('password');
                }}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.currentPassword?.message}
              />
            )}
          />
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
                onChangeText={field.onChange}
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
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.repeatPassword?.message}
              />
            )}
          />
        </View>
      </FormPage>
      {guard.sheet}
    </>
  );
}
