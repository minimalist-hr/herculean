import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { HeaderIconButton } from '@/components/header-icon-button';
import { Skeleton } from '@/components/skeleton';
import { useCurrentUser } from '@/features/account/use-current-user';
import { UnreadDot, dotSize } from '@/features/feedback/unread-dot';
import { useUnreadFeedback } from '@/features/feedback/use-feedback';
import { useTheme } from '@/theme/theme-provider';

import { initialsOf } from './settings-labels';
import { photoUri, useUserPhoto } from './use-user-photo';

/** The avatar on Home, which opens Profile. */
export function ProfileButton() {
  const router = useRouter();
  const { colors, radius, size, text } = useTheme();
  const user = useCurrentUser().data;
  const image = useUserPhoto().data?.image;
  const unread = (useUnreadFeedback().data ?? 0) > 0;

  return (
    <HeaderIconButton
      label={
        unread
          ? 'Profile and settings, new feedback reply'
          : 'Profile and settings'
      }
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
      {unread && (
        <View style={styles.dot}>
          <UnreadDot />
        </View>
      )}
    </HeaderIconButton>
  );
}

const styles = StyleSheet.create({
  // Half over the button's corner, so it reads as a badge.
  dot: {
    position: 'absolute',
    top: -dotSize / 2,
    right: -dotSize / 2,
  },
});
