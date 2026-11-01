import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { toFormErrors } from '@/api/problem';
import { Button } from '@/components/button';
import { notifyFailure, notifySuccess } from '@/components/notifications';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';

const groupNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name.')
    .max(30, 'At most 30 characters.'),
});

/** How many exercises use a group, in words. */
export function countOf({ exerciseCount }: { exerciseCount: number }) {
  return exerciseCount === 1
    ? '1 exercise'
    : `${String(exerciseCount)} exercises`;
}

interface GroupNameSheetProps {
  visible: boolean;
  title: string;
  message: string;
  initialName: string;
  saving: boolean;
  /** Saves the name. A failure it throws shows under Name, or in a notification. */
  onSave: (name: string) => Promise<{ name: string }>;
  onClose: () => void;
  savedMessage: (name: string) => string;
}

export function GroupNameSheet({
  visible,
  title,
  message,
  initialName,
  saving,
  onSave,
  onClose,
  savedMessage,
}: GroupNameSheetProps) {
  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(groupNameSchema),
    defaultValues: { name: initialName },
  });

  const submit = handleSubmit(async ({ name }) => {
    try {
      const group = await onSave(name);
      onClose();
      notifySuccess(savedMessage(group.name));
    } catch (error) {
      const formErrors = toFormErrors(error, ['name'], {
        'group.name_taken': 'name',
      });
      if (formErrors.fields.name !== undefined) {
        setError('name', { message: formErrors.fields.name });
      }
      if (formErrors.general) {
        // The bar can't show above a sheet, so the sheet makes way for it.
        onClose();
        notifyFailure("Couldn't save the group. Try again.");
      }
    }
  });

  return (
    <Sheet
      visible={visible}
      title={title}
      message={message}
      onClose={onClose}
      body={
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label="Name"
              placeholder="Core"
              autoCapitalize="sentences"
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={formState.errors.name?.message}
            />
          )}
        />
      }
    >
      <Button
        label="Save group"
        waitingLabel="Saving group"
        waiting={saving}
        onPress={() => void submit()}
      />
      <Button
        label="Cancel"
        variant="secondary"
        dimmed={saving}
        onPress={onClose}
      />
    </Sheet>
  );
}
