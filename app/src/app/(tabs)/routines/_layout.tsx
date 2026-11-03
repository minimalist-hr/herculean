import { Stack } from 'expo-router';

import { usePageOptions } from '@/components/use-page-options';

export default function RoutinesLayout() {
  const pageOptions = usePageOptions();

  return <Stack screenOptions={pageOptions} />;
}
