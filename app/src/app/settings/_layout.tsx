import { Stack } from 'expo-router';

import { usePageOptions } from '@/components/use-page-options';

export default function SettingsLayout() {
  const pageOptions = usePageOptions();

  return <Stack screenOptions={pageOptions} />;
}
