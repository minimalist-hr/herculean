import { useLocalSearchParams } from 'expo-router';

import { FinishScreen } from '@/features/workout/finish-screen';

export default function FinishRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <FinishScreen id={id} />;
}
