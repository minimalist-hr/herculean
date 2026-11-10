import { Stack } from 'expo-router';

import { tabStackSettings } from '@/components/tab-bar';
import { usePageOptions } from '@/components/use-page-options';

export const unstable_settings = tabStackSettings;

export default function ExercisesLayout() {
  const pageOptions = usePageOptions();

  return <Stack screenOptions={pageOptions} />;
}
