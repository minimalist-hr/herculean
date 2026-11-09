import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { toFormErrors } from '@/api/problem';
import { Button } from '@/components/button';
import { FormPage } from '@/components/form-page';
import {
  clearingNotification,
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { TextField } from '@/components/text-field';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { useCurrentUser } from '@/features/account/use-current-user';
import { useTheme } from '@/theme/theme-provider';

import { PendingEmailCard } from './pending-email-card';
import { useRequestEmailChange } from './use-email-change';

const title = 'Email';
const subtitle = 'Used to sign in.';
const emailLabel = 'Email';
const emailHelper = 'We’ll send a link to confirm the new address.';
const passwordLabel = 'Current password';

const changeEmailSchema = z.object({
  newEmail: z.string().trim().pipe(z.email('Enter a valid email.')),
  currentPassword: z.string().min(1, 'Enter your current password.'),
});

export function ChangeEmailScreen() {
  const user = useCurrentUser();

  if (user.data === undefined) {
    return null;
  }

  return <ChangeEmailForm currentEmail={user.data.email} />;
}

function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const { space } = useTheme();
  const requestChange = useRequestEmailChange();
  const { control, handleSubmit, setError, setFocus, formState } = useForm({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: currentEmail, currentPassword: '' },
  });
  const { errors } = formState;
  const guard = useLeaveGuard(formState.isDirty);

  const submit = handleSubmit(async (values) => {
    dismissNotification();
    guard.allow();
    try {
      await requestChange.mutateAsync(values);
      router.back();
      notifySuccess(`Link sent to ${values.newEmail}.`);
    } catch (error) {
      guard.block();
      const formErrors = toFormErrors(error, ['newEmail', 'currentPassword'], {
        'user.email_taken': 'newEmail',
      });
      const { newEmail, currentPassword } = formErrors.fields;
      if (newEmail !== undefined) {
        setError('newEmail', { message: newEmail });
      }
      if (currentPassword !== undefined) {
        setError('currentPassword', { message: currentPassword });
      }
      if (formErrors.general) {
        notifyFailure('Couldn’t send the link. Try again.');
      }
    }
  });

  return (
    <>
      <FormPage
        back="Settings"
        title={title}
        subtitle={subtitle}
        action={
          <Button
            label="Save email"
            waitingLabel="Saving email"
            waiting={requestChange.isPending}
            onPress={() => void submit()}
          />
        }
      >
        <PendingEmailCard />
        <View style={{ gap: space.lg }}>
          <Controller
            control={control}
            name="newEmail"
            render={({ field }) => (
              <TextField
                ref={field.ref}
                label={emailLabel}
                autoComplete="email"
                autoCapitalize="none"
                keyboardType="email-address"
                helper={emailHelper}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => {
                  setFocus('currentPassword');
                }}
                value={field.value}
                onChangeText={clearingNotification(field.onChange)}
                onBlur={field.onBlur}
                error={errors.newEmail?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="currentPassword"
            render={({ field }) => (
              <TextField
                ref={field.ref}
                label={passwordLabel}
                autoComplete="current-password"
                password
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
                value={field.value}
                onChangeText={clearingNotification(field.onChange)}
                onBlur={field.onBlur}
                error={errors.currentPassword?.message}
              />
            )}
          />
        </View>
      </FormPage>
      {guard.sheet}
    </>
  );
}
