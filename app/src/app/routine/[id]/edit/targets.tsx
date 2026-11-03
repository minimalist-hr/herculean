import { useLocalSearchParams } from 'expo-router';

import { TargetsScreen } from '@/features/routines/targets-screen';

export default function TargetsRoute() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  return <TargetsScreen exerciseId={exerciseId} back="Edit routine" />;
}
