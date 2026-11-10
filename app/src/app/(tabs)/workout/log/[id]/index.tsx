import { useLocalSearchParams } from 'expo-router';

import { LogScreen } from '@/features/workout/log-screen';

export default function LogRoute() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();

  return <LogScreen id={id} openedFromHome={from === 'home'} />;
}
