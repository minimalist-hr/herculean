import { useLocalSearchParams } from 'expo-router';

import { NewRoutineScreen } from '@/features/routines/new-routine-screen';

export default function NewRoutineRoute() {
  const { name } = useLocalSearchParams<{ name?: string }>();

  return <NewRoutineScreen initialName={name} />;
}
