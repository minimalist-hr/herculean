import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/button';
import { useFormDelete, type FormDelete } from '@/components/form-delete';
import { FormPage } from '@/components/form-page';
import { notifySuccess } from '@/components/notifications';
import { useLeaveGuard } from '@/components/use-leave-guard';

import { showSaveFailure, TitleTextFields } from './title-text-fields';
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
  remove?: FormDelete;
}) {
  const router = useRouter();
  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(savedReplySchema),
    defaultValues: initial,
  });
  const guard = useLeaveGuard(formState.isDirty);
  const deleting = useFormDelete(remove, guard);

  const submit = handleSubmit(async (draft) => {
    guard.allow();
    try {
      await onSave(draft);
      notifySuccess(savedMessage);
      router.back();
    } catch (error) {
      guard.block();
      showSaveFailure(error, setError, 'Couldn’t save the reply. Try again.');
    }
  });

  return (
    <>
      <FormPage
        back="Saved replies"
        title={title}
        headerAction={deleting.headerAction}
        action={
          <Button
            label="Save reply"
            waitingLabel="Saving reply"
            waiting={saving}
            onPress={() => void submit()}
          />
        }
      >
        <TitleTextFields
          control={control}
          errors={formState.errors}
          titleMaxLength={titleMaxLength}
          textMaxLength={textMaxLength}
          textHelper="Write {name} for the user’s name."
        />
      </FormPage>
      {deleting.sheet}
      {guard.sheet}
    </>
  );
}
