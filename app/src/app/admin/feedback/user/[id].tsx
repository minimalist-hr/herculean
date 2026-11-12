import { useRouter } from 'expo-router';

import { UserScreen } from '@/features/admin/user-screen';

export default function FeedbackUserRoute() {
  const router = useRouter();

  return (
    <UserScreen
      openTicket={(id, back) => {
        router.push({ pathname: '/admin/feedback/[id]', params: { id, back } });
      }}
    />
  );
}
