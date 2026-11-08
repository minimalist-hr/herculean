import { useLocalSearchParams } from 'expo-router';

import { WorkoutScreen } from '@/features/workout/workout-screen';

export default function DayRoute() {
  const { date, from } = useLocalSearchParams<{
    date: string;
    from?: string;
  }>();

  return <WorkoutScreen openedDate={date} openedFromHome={from === 'home'} />;
}
