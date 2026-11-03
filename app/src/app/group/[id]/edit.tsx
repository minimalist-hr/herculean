import { useLocalSearchParams } from 'expo-router';

import { EditGroupScreen } from '@/features/exercises/edit-group-screen';

export default function EditGroupRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EditGroupScreen id={id} />;
}
