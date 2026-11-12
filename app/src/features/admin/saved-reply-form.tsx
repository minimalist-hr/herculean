import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { toFormErrors } from '@/api/problem';
import { Button } from '@/components/button';
import { FormPage } from '@/components/form-page';
import { HeaderIconButton } from '@/components/header-icon-button';
import { TrashIcon } from '@/components/icons';
import {
  clearingNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { useTheme } from '@/theme/theme-provider';

import {
  textMaxLength,
  titleMaxLength,
  type SavedReplyDraft,
} from './use-saved-replies';

const savedReplySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Enter a title.')
    .max(titleMaxLength, 'At most 50 characters.'),
  text: z
    .string()
    .trim()
    .min(1, 'Write the reply.')
    .max(textMaxLength, 'At most 2,000 characters.'),
});

/** New saved reply and Edit saved reply: a title and a text, and Delete on Edit. */
export function SavedReplyForm({
  title,
  initial,
  saving,
  onSave,
  savedMessage,
  remove,
}: {
  title: string;
  initial: SavedReplyDraft;
  saving: boolean;
  /** Saves the reply. A failure it throws shows under its field, or in a notification. */
  onSave: (draft: SavedReplyDraft) => Promise<unknown>;
  savedMessage: string;
  /** Edit has a delete that asks first. */
  remove?: { deleting: boolean; onDelete: () => Promise<unknown> };
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(savedReplySchema),
    defaultValues: initial,
  });
  const guard = useLeaveGuard(formState.isDirty);

  const submit = handleSubmit(async (draft) => {
    guard.allow();
    try {
      await onSave(draft);
      notifySuccess(savedMessage);
      router.back();
    } catch (error) {
      guard.block();
      const formErrors = toFormErrors(error, ['title', 'text']);
      if (formErrors.fields.title !== undefined) {
        setError('title', { message: formErrors.fields.title });
      }
      if (formErrors.fields.text !== undefined) {
        setError('text', { message: formErrors.fields.text });
      }
      if (formErrors.general) {
        notifyFailure('Couldn’t save the reply. Try again.');
      }
    }
  });

  async function confirmDelete() {
    if (remove === undefined) {
      return;
    }

    guard.allow();
    try {
      await remove.onDelete();
      setConfirmingDelete(false);
      notifySuccess('Saved reply deleted.');
      router.back();
    } catch {
      guard.block();
      notifyFailure('Couldn’t delete the reply. Try again.');
    }
  }

  return (
    <>
      <FormPage
        back="Saved replies"
        title={title}
        headerAction={
          remove === undefined ? undefined : (
            <HeaderIconButton
              label="Delete saved reply"
              onPress={() => {
                setConfirmingDelete(true);
              }}
            >
              <TrashIcon color={colors.dangerFill} size={20} />
            </HeaderIconButton>
          )
        }
        action={
          <Button
            label="Save reply"
            waitingLabel="Saving reply"
            waiting={saving}
            onPress={() => void submit()}
          />
        }
      >
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label="Title"
              autoCapitalize="sentences"
              maxLength={titleMaxLength}
              returnKeyType="next"
              value={field.value}
              onChangeText={clearingNotification(field.onChange)}
              onBlur={field.onBlur}
              error={formState.errors.title?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="text"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label="Text"
              multiline
              maxLength={textMaxLength}
              helper="Write {name} for the user’s name."
              value={field.value}
              onChangeText={clearingNotification(field.onChange)}
              onBlur={field.onBlur}
              error={formState.errors.text?.message}
            />
          )}
        />
      </FormPage>
      {remove !== undefined && (
        <Sheet
          visible={confirmingDelete}
          title="Delete this saved reply?"
          message="It’s gone for good."
          onClose={() => {
            setConfirmingDelete(false);
          }}
        >
          <Button
            label="Delete"
            waitingLabel="Deleting"
            variant="danger"
            waiting={remove.deleting}
            onPress={() => void confirmDelete()}
          />
        </Sheet>
      )}
      {guard.sheet}
    </>
  );
}
