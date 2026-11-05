import { useLocalSearchParams } from 'expo-router';

import { LogScreen } from '@/features/workout/log-screen';

export default function LogRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <LogScreen id={id} />;
}
