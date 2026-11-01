import { dismissNotification } from '@/components/notifications';

// Notifications outlive screens, so one test's must not show in the next.
afterEach(() => {
  dismissNotification();
});
