import { useLocalSearchParams } from 'expo-router';

import { NewRoutineScreen } from '@/features/routines/new-routine-screen';
import { weekdays } from '@/formats/formats';

export default function NewRoutineRoute() {
  const { name, day } = useLocalSearchParams<{ name?: string; day?: string }>();
  const picked = weekdays.find((weekday) => weekday === day);

  return (
    <NewRoutineScreen initialName={name} initialWeekdays={picked && [picked]} />
  );
}
