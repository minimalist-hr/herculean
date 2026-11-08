import { useLocalSearchParams } from 'expo-router';

import { MonthScreen } from '@/features/workout/month-screen';

export default function MonthRoute() {
  const { from } = useLocalSearchParams<{ from?: string }>();

  return <MonthScreen openedFromHome={from === 'home'} />;
}
