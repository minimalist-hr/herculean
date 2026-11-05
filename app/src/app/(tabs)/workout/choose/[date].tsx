import { useLocalSearchParams } from 'expo-router';

import { ChooseRoutineScreen } from '@/features/workout/choose-routine-screen';

export default function ChooseRoutineRoute() {
  const { date } = useLocalSearchParams<{ date: string }>();

  return <ChooseRoutineScreen date={date} />;
}
