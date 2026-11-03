import { useLocalSearchParams } from 'expo-router';

import { RoutineScreen } from '@/features/routines/routine-screen';

export default function RoutineRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <RoutineScreen id={id} />;
}
