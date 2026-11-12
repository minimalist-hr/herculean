import { useRouter } from 'expo-router';

import { InboxTicketScreen } from '@/features/admin/inbox-ticket-screen';

export default function UserTicketRoute() {
  const router = useRouter();

  return (
    <InboxTicketScreen
      openUser={(id, back) => {
        router.push({ pathname: '/admin/users/[id]', params: { id, back } });
      }}
    />
  );
}
