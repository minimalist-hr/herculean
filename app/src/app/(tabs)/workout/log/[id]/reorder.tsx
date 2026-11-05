import { useLocalSearchParams } from 'expo-router';

import { ReorderScreen } from '@/features/workout/reorder-screen';

export default function ReorderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ReorderScreen id={id} />;
}
