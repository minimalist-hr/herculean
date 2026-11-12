import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { useAddNote } from './use-ticket-tools';

const noteMaxLength = 2000;

const noteSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Write a note.')
    .max(noteMaxLength, 'At most 2,000 characters.'),
});

/** A note on a ticket, which only admins see. */
export function AddNoteScreen() {
  const router = useRouter();
  const { id, back } = useLocalSearchParams<{ id: string; back?: string }>();
  const addNote = useAddNote(id);
  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: { text: '' },
  });
  const guard = useLeaveGuard(formState.isDirty);

  const submit = handleSubmit(async ({ text }) => {
    guard.allow();
    try {
      await addNote.mutateAsync(text);
      notifySuccess('Note saved.');
      router.back();
    } catch (error) {
      guard.block();
      const formErrors = toFormErrors(error, ['text']);
      if (formErrors.fields.text !== undefined) {
        setError('text', { message: formErrors.fields.text });
      }
      if (formErrors.general) {
        notifyFailure('Couldn’t save the note. Try again.');
      }
    }
  });

  return (
    <>
      <FormPage
        back={back ?? 'Ticket'}
        title="Add note"
        subtitle="Only admins see notes."
        action={
          <Button
            label="Save note"
            waitingLabel="Saving note"
            waiting={addNote.isPending}
            onPress={() => void submit()}
          />
        }
      >
        <Controller
          control={control}
          name="text"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label="Note"
              multiline
              maxLength={noteMaxLength}
              value={field.value}
              onChangeText={clearingNotification(field.onChange)}
              onBlur={field.onBlur}
              error={formState.errors.text?.message}
            />
          )}
        />
      </FormPage>
      {guard.sheet}
    </>
  );
}
