import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetError,
} from 'react-hook-form';

import { toFormErrors } from '@/api/problem';
import {
  clearingNotification,
  notifyFailure,
} from '@/components/notifications';
import { TextField } from '@/components/text-field';

/** What a title and text form holds, such as a saved reply or the announcement. */
export interface TitleTextDraft {
  title: string;
  text: string;
}

/** The Title and Text fields of an admin's form, with their limits and errors. */
export function TitleTextFields({
  control,
  errors,
  titleMaxLength,
  textMaxLength,
  textHelper,
}: {
  control: Control<TitleTextDraft>;
  errors: FieldErrors<TitleTextDraft>;
  titleMaxLength: number;
  textMaxLength: number;
  textHelper?: string;
}) {
  return (
    <>
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
            error={errors.title?.message}
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
            helper={textHelper}
            value={field.value}
            onChangeText={clearingNotification(field.onChange)}
            onBlur={field.onBlur}
            error={errors.text?.message}
          />
        )}
      />
    </>
  );
}

/** Shows a failed save: under Title or Text when the API names one, otherwise as a notification. */
export function showSaveFailure(
  error: unknown,
  setError: UseFormSetError<TitleTextDraft>,
  failureMessage: string,
) {
  const formErrors = toFormErrors(error, ['title', 'text']);
  if (formErrors.fields.title !== undefined) {
    setError('title', { message: formErrors.fields.title });
  }
  if (formErrors.fields.text !== undefined) {
    setError('text', { message: formErrors.fields.text });
  }
  if (formErrors.general) {
    notifyFailure(failureMessage);
  }
}
