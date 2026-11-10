import { useLocalSearchParams } from 'expo-router';

import { RoutineScreen } from '@/features/routines/routine-screen';

export default function WorkoutRoutineRoute() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();

  return <RoutineScreen id={id} from={from} />;
}
