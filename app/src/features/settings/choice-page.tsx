import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { FormPage } from '@/components/form-page';
import { LoadFailure } from '@/components/load-failure';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { RadioCard } from '@/components/radio-card';
import { Skeleton } from '@/components/skeleton';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { useTheme } from '@/theme/theme-provider';

export interface Choice<Value extends string> {
  value: Value;
  label: string;
  detail?: string;
}

interface ChoicePageProps<Value extends string> {
  /** For example "Theme". It names the page, its button and what it says when saved. */
  title: string;
  subtitle: string;
  choices: Choice<Value>[];
  /** What is saved now. Undefined while it loads. */
  saved: Value | undefined;
  loadFailed: boolean;
  onRetry: () => void;
  saving: boolean;
  onSave: (value: Value) => Promise<unknown>;
}

/** A setting with a few choices, saved with its button. The back link cancels. */
export function ChoicePage<Value extends string>(
  props: ChoicePageProps<Value>,
) {
  const { title, subtitle, saved, loadFailed, onRetry } = props;

  if (saved === undefined) {
    return (
      <FormPage back="Settings" title={title} subtitle={subtitle}>
        {loadFailed ? (
          <LoadFailure
            message={`Couldn’t load your ${title.toLowerCase()}.`}
            onRetry={onRetry}
          />
        ) : (
          <ChoicesSkeleton count={props.choices.length} />
        )}
      </FormPage>
    );
  }

  return <ChoiceForm {...props} saved={saved} />;
}

function ChoiceForm<Value extends string>({
  title,
  subtitle,
  choices,
  saved,
  saving,
  onSave,
}: ChoicePageProps<Value> & { saved: Value }) {
  const router = useRouter();
  const { space } = useTheme();
  const [picked, setPicked] = useState(saved);
  const guard = useLeaveGuard(picked !== saved);
  const name = title.toLowerCase();

  async function save() {
    dismissNotification();
    guard.allow();
    try {
      await onSave(picked);
      router.back();
      notifySuccess(`${title} saved.`);
    } catch {
      guard.block();
      notifyFailure(`Couldn’t save the ${name}. Try again.`);
    }
  }

  return (
    <>
      <FormPage
        back="Settings"
        title={title}
        subtitle={subtitle}
        action={
          <Button
            label={`Save ${name}`}
            waitingLabel={`Saving ${name}`}
            waiting={saving}
            onPress={() => {
              void save();
            }}
          />
        }
      >
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={title}
          style={{ gap: space.sm }}
        >
          {choices.map((choice) => (
            <RadioCard
              key={choice.value}
              label={choice.label}
              detail={choice.detail}
              selected={picked === choice.value}
              onSelect={() => {
                setPicked(choice.value);
              }}
            />
          ))}
        </View>
      </FormPage>
      {guard.sheet}
    </>
  );
}

function ChoicesSkeleton({ count }: { count: number }) {
  const { size, space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel="Loading"
      accessibilityLiveRegion="polite"
      style={{ gap: space.sm }}
    >
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} width="100%" height={size.optionRowMin} />
      ))}
    </View>
  );
}
