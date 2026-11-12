import { queryClient } from '@/api/query-client';
import { dismissNotification, forgetSheets } from '@/components/notifications';

afterEach(() => {
  // Notifications outlive screens, so one test's must not show in the next.
  dismissNotification();
  // So do sheets and what waits for them to close.
  forgetSheets();
  // Signing in keeps the user in the app's own client, whose clean-up timer would hold Jest open.
  queryClient.clear();
});
