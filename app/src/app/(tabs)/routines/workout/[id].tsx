import { useLocalSearchParams } from 'expo-router';

import { WorkoutDetailsScreen } from '@/features/workout/workout-details-screen';

export default function RoutineWorkoutRoute() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();

  return <WorkoutDetailsScreen id={id} from={from} />;
}
