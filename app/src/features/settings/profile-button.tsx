import { useRouter } from 'expo-router';
import { Image, Text } from 'react-native';

import { HeaderIconButton } from '@/components/header-icon-button';
import { Skeleton } from '@/components/skeleton';
import { useCurrentUser } from '@/features/account/use-current-user';
import { useTheme } from '@/theme/theme-provider';

import { initialsOf } from './settings-labels';
import { photoUri, useUserPhoto } from './use-user-photo';

/** The avatar on Home, which opens Settings. */
export function ProfileButton() {
  const router = useRouter();
  const { colors, radius, size, text } = useTheme();
  const user = useCurrentUser().data;
  const image = useUserPhoto().data?.image;

  return (
    <HeaderIconButton
      label="Profile and settings"
      onPress={() => {
        router.push('/settings');
      }}
    >
      {image ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: photoUri(image) }}
          style={{
            width: size.headerIconButton - 2,
            height: size.headerIconButton - 2,
            borderRadius: radius.control - 1,
          }}
        />
      ) : user === undefined ? (
        <Skeleton width={20} height={12} />
      ) : (
        <Text style={[text.secondaryButton, { color: colors.text }]}>
          {initialsOf(user.name, user.email)}
        </Text>
      )}
    </HeaderIconButton>
  );
}
