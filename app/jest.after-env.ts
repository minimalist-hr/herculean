import { queryClient } from '@/api/query-client';
import { dismissNotification } from '@/components/notifications';

afterEach(() => {
  // Notifications outlive screens, so one test's must not show in the next.
  dismissNotification();
  // Signing in keeps the user in the app's own client, whose clean-up timer would hold Jest open.
  queryClient.clear();
});
