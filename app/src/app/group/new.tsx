import { useLocalSearchParams } from 'expo-router';

import { NewGroupScreen } from '@/features/exercises/new-group-screen';

export default function NewGroupRoute() {
  const { name, back, pick } = useLocalSearchParams<{
    name?: string;
    back?: string;
    pick?: string;
  }>();

  return (
    <NewGroupScreen initialName={name} back={back} pick={pick === 'true'} />
  );
}
