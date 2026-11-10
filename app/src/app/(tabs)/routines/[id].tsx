import { useLocalSearchParams } from 'expo-router';

import { RoutineScreen } from '@/features/routines/routine-screen';

export default function RoutineRoute() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();

  return <RoutineScreen id={id} from={from} />;
}
