import { useLocalSearchParams } from 'expo-router';

import { EditRoutineScreen } from '@/features/routines/edit-routine-screen';

export default function EditRoutineRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EditRoutineScreen id={id} />;
}
