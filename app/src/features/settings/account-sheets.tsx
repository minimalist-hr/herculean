import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { api } from '@/api/client';
import { toApiError, toFormErrors } from '@/api/problem';
import { Button } from '@/components/button';
import {
  clearingNotification,
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { endSession } from '@/features/account/session';
import { signOut } from '@/features/account/session-flows';

interface AccountSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function SignOutSheet({ visible, onClose }: AccountSheetProps) {
  const signOutNow = useMutation({ mutationFn: signOut });

  return (
    <Sheet
      visible={visible}
      title="Sign out?"
      message="You can sign back in any time."
      onClose={onClose}
    >
      <Button
        label="Sign out"
        waitingLabel="Signing out"
        waiting={signOutNow.isPending}
        onPress={() => {
          signOutNow.mutate();
        }}
      />
    </Sheet>
  );
}

const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
});

export function DeleteAccountSheet({ visible, onClose }: AccountSheetProps) {
  const deleteAccount = useMutation({
    mutationFn: async (currentPassword: string) => {
      const { error, response } = await api.DELETE('/api/v1/users/me', {
        body: { currentPassword },
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
  });
  const { control, handleSubmit, reset, setError, formState } = useForm({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { currentPassword: '' },
  });

  function close() {
    reset();
    onClose();
  }

  const submit = handleSubmit(async ({ currentPassword }) => {
    dismissNotification();
    try {
      await deleteAccount.mutateAsync(currentPassword);
      await endSession();
      notifySuccess('Account will be deleted in 14 days.');
    } catch (error) {
      const formErrors = toFormErrors(error, ['currentPassword']);
      if (formErrors.fields.currentPassword !== undefined) {
        setError('currentPassword', {
          message: formErrors.fields.currentPassword,
        });
      }
      if (formErrors.general) {
        notifyFailure("Couldn't delete your account. Try again.");
      }
    }
  });

  return (
    <Sheet
      visible={visible}
      title="Delete your account?"
      message="Your account will be deleted in 14 days. Sign in before then to keep it."
      onClose={close}
      actionsAboveKeyboard
      body={
        <Controller
          control={control}
          name="currentPassword"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label="Current password"
              autoComplete="current-password"
              password
              returnKeyType="done"
              value={field.value}
              onChangeText={clearingNotification(field.onChange)}
              onBlur={field.onBlur}
              error={formState.errors.currentPassword?.message}
            />
          )}
        />
      }
    >
      <Button
        label="Delete account"
        variant="danger"
        waitingLabel="Deleting account"
        waiting={deleteAccount.isPending}
        onPress={() => void submit()}
      />
    </Sheet>
  );
}
