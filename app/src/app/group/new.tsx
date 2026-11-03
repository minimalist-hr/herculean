import { useLocalSearchParams } from 'expo-router';

import { NewGroupScreen } from '@/features/exercises/new-group-screen';

export default function NewGroupRoute() {
  const { name } = useLocalSearchParams<{ name?: string }>();

  return <NewGroupScreen initialName={name} />;
}
