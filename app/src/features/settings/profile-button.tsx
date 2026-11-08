import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { HeaderIconButton } from '@/components/header-icon-button';
import { Skeleton } from '@/components/skeleton';
import { useCurrentUser } from '@/features/account/use-current-user';
import { useTheme } from '@/theme/theme-provider';

import { initialsOf } from './settings-labels';

/** The avatar on Home, which opens Settings. */
export function ProfileButton() {
  const router = useRouter();
  const { colors, text } = useTheme();
  const user = useCurrentUser().data;

  return (
    <HeaderIconButton
      label="Profile and settings"
      onPress={() => {
        router.push('/settings');
      }}
    >
      {user === undefined ? (
        <Skeleton width={20} height={12} />
      ) : (
        <Text style={[text.secondaryButton, { color: colors.text }]}>
          {initialsOf(user.name, user.email)}
        </Text>
      )}
    </HeaderIconButton>
  );
}
