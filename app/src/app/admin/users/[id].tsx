import { useRouter } from 'expo-router';

import { UserScreen } from '@/features/admin/user-screen';

export default function UserRoute() {
  const router = useRouter();

  return (
    <UserScreen
      openTicket={(id, back) => {
        router.push({
          pathname: '/admin/users/ticket/[id]',
          params: { id, back },
        });
      }}
    />
  );
}
