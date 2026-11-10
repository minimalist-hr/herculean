import { useLocalSearchParams } from 'expo-router';

import { EditSetScreen } from '@/features/workout/edit-set-screen';
import type { SetField } from '@/features/workout/set-values';

export default function EditSetRoute() {
  const { exercise, set, field } = useLocalSearchParams<{
    exercise: string;
    set: string;
    field: SetField;
  }>();

  return <EditSetScreen exerciseId={exercise} setId={set} field={field} />;
}
