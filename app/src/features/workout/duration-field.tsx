import { TextField } from '@/components/text-field';
import { clearingNotification } from '@/components/notifications';

export const durationLabel = 'Duration in minutes';

const minMinutes = 1;
const maxMinutes = 600;

/** The minutes typed, or null when left empty. */
export function durationMinutes(typed: string) {
  return typed === '' ? null : Number(typed);
}

/** What is wrong with the minutes typed, or undefined. */
export function durationError(typed: string) {
  const minutes = durationMinutes(typed);
  if (minutes === null) {
    return undefined;
  }
  if (minutes < minMinutes) {
    return 'At least 1 minute.';
  }

  return minutes > maxMinutes ? 'At most 600 minutes.' : undefined;
}

/** A saved duration as the form shows it: whole minutes, at least one. */
export function typedDuration(durationSeconds: number | null | undefined) {
  return durationSeconds === null || durationSeconds === undefined
    ? ''
    : String(Math.max(minMinutes, Math.round(durationSeconds / 60)));
}

/** How long a workout took, in whole minutes. Only digits can be typed. */
export function DurationField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (typed: string) => void;
}) {
  return (
    <TextField
      label={durationLabel}
      optional
      keyboardType="number-pad"
      returnKeyType="done"
      maxLength={4}
      value={value}
      error={error}
      onChangeText={clearingNotification((typed: string) => {
        onChange(typed.replace(/\D/g, ''));
      })}
    />
  );
}
