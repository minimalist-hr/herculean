import { Stack } from 'expo-router';

import { usePageOptions } from '@/components/use-page-options';
import { RoutineDraftProvider } from '@/features/routines/routine-draft';

export default function NewRoutineLayout() {
  const pageOptions = usePageOptions();

  return (
    <RoutineDraftProvider>
      <Stack screenOptions={pageOptions} />
    </RoutineDraftProvider>
  );
}
