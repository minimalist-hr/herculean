import { useLocalSearchParams } from 'expo-router';

import { EditWorkoutDraft } from '@/features/workout/edit-workout-screen';

export default function EditWorkoutLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EditWorkoutDraft id={id} />;
}
