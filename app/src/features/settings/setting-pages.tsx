import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { toFormErrors } from '@/api/problem';
import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { FormPage } from '@/components/form-page';
import { LoadFailure } from '@/components/load-failure';
import {
  clearingNotification,
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { QuickPicks } from '@/components/quick-picks';
import { Skeleton } from '@/components/skeleton';
import { Stepper } from '@/components/stepper';
import { TextField } from '@/components/text-field';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { userNameSchema } from '@/features/account/setup-schema';
import { useCurrentUser } from '@/features/account/use-current-user';
import { useWorkoutSettings } from '@/features/workout/use-workout-settings';
import { formatClock, formatSpokenDuration } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { ChoicePage } from './choice-page';
import { defaultRest } from './default-rest';
import { colorLabels, themeLabels, unitLabels } from './settings-labels';
import { useUpdateDefaultRest, useUpdateUser } from './use-update-settings';

type Schemas = components['schemas'];

export function ThemeScreen() {
  const user = useCurrentUser();
  const update = useUpdateUser();

  return (
    <ChoicePage<Schemas['Theme']>
      title="Theme"
      subtitle="Match my phone is the default."
      choices={[
        {
          value: 'matchPhone',
          label: themeLabels.matchPhone,
          detail: 'Follows your phone’s setting',
        },
        { value: 'dark', label: themeLabels.dark },
        { value: 'light', label: themeLabels.light },
      ]}
      saved={user.data?.theme}
      loadFailed={user.isError}
      onRetry={() => {
        void user.refetch();
      }}
      saving={update.isPending}
      onSave={(theme) => update.mutateAsync({ theme })}
    />
  );
}

export function ColorScreen() {
  const user = useCurrentUser();
  const update = useUpdateUser();

  return (
    <ChoicePage<Schemas['Color']>
      title="Color"
      subtitle="Used for buttons, today and completed sets."
      choices={[
        { value: 'nitro', label: colorLabels.nitro },
        { value: 'chrome', label: colorLabels.chrome },
      ]}
      saved={user.data?.color}
      loadFailed={user.isError}
      onRetry={() => {
        void user.refetch();
      }}
      saving={update.isPending}
      onSave={(color) => update.mutateAsync({ color })}
    />
  );
}

export function UnitsScreen() {
  const user = useCurrentUser();
  const update = useUpdateUser();

  return (
    <ChoicePage<Schemas['Units']>
      title="Units"
      subtitle="Changes how weights and body measurements are shown. Your logged data stays the same."
      choices={[
        { value: 'metric', label: unitLabels.metric, detail: 'kg, cm' },
        { value: 'imperial', label: unitLabels.imperial, detail: 'lb, in' },
      ]}
      saved={user.data?.units}
      loadFailed={user.isError}
      onRetry={() => {
        void user.refetch();
      }}
      saving={update.isPending}
      onSave={(units) => update.mutateAsync({ units })}
    />
  );
}

const restTitle = 'Default rest time';
const restSubtitle =
  'Starts after every checked set. You can still change it during rest.';

export function DefaultRestScreen() {
  const settings = useWorkoutSettings();

  if (settings.data === undefined) {
    return (
      <FormPage back="Settings" title={restTitle} subtitle={restSubtitle}>
        {settings.isError ? (
          <LoadFailure
            message="Couldn't load your rest time."
            onRetry={() => {
              void settings.refetch();
            }}
          />
        ) : (
          <RestSkeleton />
        )}
      </FormPage>
    );
  }

  return <DefaultRestForm saved={settings.data.defaultRestSeconds} />;
}

function DefaultRestForm({ saved }: { saved: number }) {
  const router = useRouter();
  const { space } = useTheme();
  const update = useUpdateDefaultRest();
  const [seconds, setSeconds] = useState(saved);
  const guard = useLeaveGuard(seconds !== saved);

  async function save() {
    dismissNotification();
    guard.allow();
    try {
      await update.mutateAsync(seconds);
      router.back();
      notifySuccess(`${restTitle} saved.`);
    } catch {
      guard.block();
      notifyFailure("Couldn't save the rest time. Try again.");
    }
  }

  return (
    <>
      <FormPage
        back="Settings"
        title={restTitle}
        subtitle={restSubtitle}
        action={
          <Button
            label="Save rest time"
            waitingLabel="Saving rest time"
            waiting={update.isPending}
            onPress={() => {
              void save();
            }}
          />
        }
      >
        <View style={{ gap: space.sm }}>
          <Stepper
            label={restTitle}
            value={seconds}
            onChange={setSeconds}
            min={defaultRest.minSeconds}
            max={defaultRest.maxSeconds}
            step={defaultRest.stepSeconds}
            format={formatClock}
            formatSpoken={formatSpokenDuration}
            formatLimit={formatClock}
            lessLabel="15 seconds less"
            moreLabel="15 seconds more"
          />
          <QuickPicks
            values={defaultRest.quickPicks}
            selected={seconds}
            onSelect={setSeconds}
            format={formatClock}
            formatSpoken={formatSpokenDuration}
          />
        </View>
      </FormPage>
      {guard.sheet}
    </>
  );
}

function RestSkeleton() {
  const { size, space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel="Loading"
      accessibilityLiveRegion="polite"
      style={{ gap: space.sm }}
    >
      <Skeleton width="100%" height={size.stepper.height} />
      <Skeleton width="100%" height={size.touchTargetMin} />
    </View>
  );
}

const nameTitle = 'Name';
const nameSubtitle = 'Shown on Home and in Settings.';
const nameLabel = 'Your name';
const nameFormSchema = z.object({ name: userNameSchema });

export function NameScreen() {
  const user = useCurrentUser();

  if (user.data === undefined) {
    return (
      <FormPage back="Settings" title={nameTitle} subtitle={nameSubtitle}>
        {user.isError ? (
          <LoadFailure
            message="Couldn't load your name."
            onRetry={() => {
              void user.refetch();
            }}
          />
        ) : (
          <NameSkeleton />
        )}
      </FormPage>
    );
  }

  return <NameForm saved={user.data.name ?? ''} />;
}

function NameForm({ saved }: { saved: string }) {
  const router = useRouter();
  const update = useUpdateUser();
  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(nameFormSchema),
    defaultValues: { name: saved },
  });
  const guard = useLeaveGuard(formState.isDirty);

  const submit = handleSubmit(async ({ name }) => {
    dismissNotification();
    guard.allow();
    try {
      await update.mutateAsync({ name });
      router.back();
      notifySuccess(`${nameTitle} saved.`);
    } catch (error) {
      guard.block();
      const formErrors = toFormErrors(error, ['name']);
      if (formErrors.fields.name !== undefined) {
        setError('name', { message: formErrors.fields.name });
      }
      if (formErrors.general) {
        notifyFailure("Couldn't save the name. Try again.");
      }
    }
  });

  return (
    <>
      <FormPage
        back="Settings"
        title={nameTitle}
        subtitle={nameSubtitle}
        action={
          <Button
            label="Save name"
            waitingLabel="Saving name"
            waiting={update.isPending}
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
              label={nameLabel}
              autoComplete="name"
              autoCapitalize="words"
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

function NameSkeleton() {
  const { size, space, text } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel="Loading"
      accessibilityLiveRegion="polite"
      style={{ gap: space.sm }}
    >
      <Text style={text.eyebrow}>{nameLabel}</Text>
      <Skeleton width="100%" height={size.input} />
    </View>
  );
}
