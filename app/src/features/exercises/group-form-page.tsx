import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { toFormErrors } from '@/api/problem';
import { Button } from '@/components/button';
import { FormPage } from '@/components/form-page';
import {
  clearingNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { TextField } from '@/components/text-field';
import { useLeaveGuard } from '@/components/use-leave-guard';

const groupNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name.')
    .max(30, 'At most 30 characters.'),
});

interface GroupFormPageProps {
  /** The screen its back link returns to. */
  back: string;
  title: string;
  subtitle: string;
  initialName: string;
  saving: boolean;
  /** Saves the name. A failure it throws shows under Name, or in a notification. */
  onSave: (name: string) => Promise<{ name: string }>;
  savedMessage: (name: string) => string;
}

export function GroupFormPage({
  back,
  title,
  subtitle,
  initialName,
  saving,
  onSave,
  savedMessage,
}: GroupFormPageProps) {
  const router = useRouter();
  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(groupNameSchema),
    defaultValues: { name: initialName },
  });
  const guard = useLeaveGuard(formState.isDirty);

  const submit = handleSubmit(async ({ name }) => {
    guard.allow();
    try {
      const group = await onSave(name);
      notifySuccess(savedMessage(group.name));
      router.back();
    } catch (error) {
      guard.block();
      const formErrors = toFormErrors(error, ['name'], {
        'group.name_taken': 'name',
      });
      if (formErrors.fields.name !== undefined) {
        setError('name', { message: formErrors.fields.name });
      }
      if (formErrors.general) {
        notifyFailure('Couldn’t save the group. Try again.');
      }
    }
  });

  return (
    <>
      <FormPage
        back={back}
        title={title}
        subtitle={subtitle}
        action={
          <Button
            label="Save group"
            waitingLabel="Saving group"
            waiting={saving}
            onPress={() => void submit()}
          />
        }
      >
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label="Name"
              autoCapitalize="sentences"
              returnKeyType="done"
              value={field.value}
              onChangeText={clearingNotification(field.onChange)}
              onBlur={field.onBlur}
              error={formState.errors.name?.message}
            />
          )}
        />
      </FormPage>
      {guard.sheet}
    </>
  );
}
