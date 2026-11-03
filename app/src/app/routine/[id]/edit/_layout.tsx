import { useLocalSearchParams } from 'expo-router';

import { EditRoutineDraft } from '@/features/routines/edit-routine-screen';

export default function EditRoutineLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EditRoutineDraft id={id} />;
}
