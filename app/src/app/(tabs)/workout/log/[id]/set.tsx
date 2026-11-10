import { useLocalSearchParams } from 'expo-router';

import { LogSetScreen } from '@/features/workout/log-set-screen';
import type { SetField } from '@/features/workout/set-values';

export default function LogSetRoute() {
  const { id, exercise, set, field } = useLocalSearchParams<{
    id: string;
    exercise: string;
    set: string;
    field: SetField;
  }>();

  return (
    <LogSetScreen id={id} exerciseId={exercise} setId={set} field={field} />
  );
}
