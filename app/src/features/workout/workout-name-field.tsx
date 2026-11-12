import { clearingNotification } from '@/components/notifications';
import { TextField } from '@/components/text-field';

const maxLength = 100;

/** What is wrong with the name typed, or undefined. */
export function workoutNameError(typed: string) {
  const name = typed.trim();
  if (name === '') {
    return 'Enter a name.';
  }

  return name.length > maxLength ? 'At most 100 characters.' : undefined;
}

/** A workout's name, which starts as its routine's, or Workout without one. */
export function WorkoutNameField({
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
      label="Name"
      autoCapitalize="sentences"
      returnKeyType="done"
      value={value}
      error={error}
      onChangeText={clearingNotification(onChange)}
    />
  );
}
