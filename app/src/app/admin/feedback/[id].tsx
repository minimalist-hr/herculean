import { useRouter } from 'expo-router';

import { InboxTicketScreen } from '@/features/admin/inbox-ticket-screen';

export default function InboxTicketRoute() {
  const router = useRouter();

  return (
    <InboxTicketScreen
      openUser={(id, back) => {
        router.push({
          pathname: '/admin/feedback/user/[id]',
          params: { id, back },
        });
      }}
    />
  );
}
