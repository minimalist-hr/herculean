import { useLocalSearchParams } from 'expo-router';

import { GroupScreen } from '@/features/exercises/group-screen';

export default function GroupRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <GroupScreen id={id} />;
}
