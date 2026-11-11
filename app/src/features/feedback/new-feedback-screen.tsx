import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { ApiProblemError, toFormErrors } from '@/api/problem';
import { Button } from '@/components/button';
import { FormPage } from '@/components/form-page';
import {
  clearingNotification,
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { RadioCard } from '@/components/radio-card';
import { TextField } from '@/components/text-field';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { useTheme } from '@/theme/theme-provider';

import { limitReachedMessage, typeLabels } from './feedback-labels';
import { ScreenshotField } from './screenshot-field';
import { useSendFeedback, type TicketType } from './use-feedback';

export const messageMaxLength = 2000;

export const messageSchema = z
  .string()
  .trim()
  .min(1, 'Write a message.')
  .max(messageMaxLength, 'At most 2,000 characters.');

const formSchema = z.object({ message: messageSchema });

const types: TicketType[] = ['bug', 'suggestion', 'other'];

/** New feedback: a bug, a suggestion or anything else, with up to 4 screenshots. */
export function NewFeedbackScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { space, text } = useTheme();
  const send = useSendFeedback();
  const [type, setType] = useState<TicketType>('bug');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { message: '' },
  });
  const guard = useLeaveGuard(formState.isDirty || screenshots.length > 0);

  const submit = handleSubmit(async ({ message }) => {
    dismissNotification();
    guard.allow();
    try {
      const id = await send.mutateAsync({ type, message, screenshots });
      router.replace({
        pathname: '/settings/feedback/[id]',
        params: from === undefined ? { id } : { id, from },
      });
      notifySuccess('Feedback sent.');
    } catch (error) {
      guard.block();
      if (
        error instanceof ApiProblemError &&
        error.problem.code === 'ticket.limit_reached'
      ) {
        notifyFailure(limitReachedMessage);
        return;
      }
      const formErrors = toFormErrors(error, ['message']);
      if (formErrors.fields.message !== undefined) {
        setError('message', { message: formErrors.fields.message });
      }
      if (formErrors.general) {
        notifyFailure('Couldn’t send. Try again.');
      }
    }
  });

  return (
    <>
      <FormPage
        back={from === 'home' ? 'Home' : 'Your feedback'}
        title="New feedback"
        subtitle="Tell us what went wrong or what you’d like."
        action={
          <Button
            label="Send feedback"
            waitingLabel="Sending feedback"
            waiting={send.isPending}
            onPress={() => void submit()}
          />
        }
      >
        <View style={{ gap: space.sm }}>
          <Text style={text.eyebrow}>Type</Text>
          <View accessibilityRole="radiogroup" style={{ gap: space.sm }}>
            {types.map((choice) => (
              <View key={choice} style={{ flexDirection: 'row' }}>
                <RadioCard
                  label={typeLabels[choice]}
                  selected={type === choice}
                  onSelect={() => {
                    dismissNotification();
                    setType(choice);
                  }}
                />
              </View>
            ))}
          </View>
        </View>
        <Controller
          control={control}
          name="message"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label="Message"
              multiline
              maxLength={messageMaxLength}
              helper="Sent with your app version, phone and OS."
              value={field.value}
              onChangeText={clearingNotification(field.onChange)}
              onBlur={field.onBlur}
              error={formState.errors.message?.message}
            />
          )}
        />
        <ScreenshotField
          images={screenshots}
          onChange={(images) => {
            dismissNotification();
            setScreenshots(images);
          }}
        />
      </FormPage>
      {guard.sheet}
    </>
  );
}
