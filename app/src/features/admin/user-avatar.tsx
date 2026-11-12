import { Image, StyleSheet, Text, View } from 'react-native';

import { Skeleton } from '@/components/skeleton';
import { initialsOf } from '@/features/settings/settings-labels';
import { photoUri } from '@/features/settings/use-user-photo';
import { useTheme } from '@/theme/theme-provider';

import { useAdminUserPhoto } from './use-users';

/** A user's photo, or their initials without one, in the box Home's avatar uses. It shows only. */
export function UserAvatar({
  user,
  size: boxSize,
}: {
  /** Undefined while the user loads. */
  user?: { id: string; name: string | null; email: string; hasPhoto: boolean };
  size: number;
}) {
  const { colors, radius, text } = useTheme();
  const photo = useAdminUserPhoto(user?.hasPhoto === true ? user.id : null);
  const image = photo.data?.image;

  function renderContent() {
    if (user === undefined || (user.hasPhoto && photo.isPending)) {
      return <Skeleton width={boxSize / 2} height={boxSize / 4} />;
    }
    if (image) {
      return (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: photoUri(image) }}
          style={{
            width: boxSize - 2,
            height: boxSize - 2,
            borderRadius: radius.control - 1,
          }}
        />
      );
    }

    // Without a photo, or when it didn't load, the initials stand in.
    return (
      <Text
        style={[
          boxSize > 48 ? text.listItemName : text.secondaryButton,
          { color: colors.text },
        ]}
      >
        {initialsOf(user.name, user.email)}
      </Text>
    );
  }

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        styles.box,
        {
          width: boxSize,
          height: boxSize,
          borderRadius: radius.control,
          borderColor: colors.border,
          backgroundColor: colors.raised,
        },
      ]}
    >
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
});
