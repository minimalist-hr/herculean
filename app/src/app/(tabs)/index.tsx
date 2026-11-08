import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ProfileButton } from '@/features/settings/profile-button';

// Home is planned again later, see the wiki.
export default function HomeRoute() {
  return <PlaceholderScreen title="Home" action={<ProfileButton />} />;
}
