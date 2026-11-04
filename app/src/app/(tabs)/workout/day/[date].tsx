import { useLocalSearchParams } from 'expo-router';

import { WorkoutScreen } from '@/features/workout/workout-screen';

export default function DayRoute() {
  const { date } = useLocalSearchParams<{ date: string }>();

  return <WorkoutScreen openedDate={date} />;
}
