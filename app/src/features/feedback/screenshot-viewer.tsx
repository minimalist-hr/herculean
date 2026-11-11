import { Image, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderIconButton } from '@/components/header-icon-button';
import { CloseIcon } from '@/components/icons';
import { photoUri } from '@/features/settings/use-user-photo';
import { useTheme } from '@/theme/theme-provider';

/** A screenshot over the whole screen. Close, or the phone's back, closes it. */
export function ScreenshotViewer({
  image,
  onClose,
}: {
  /** The screenshot as a Base64 JPEG, or null when none is open. */
  image: string | null;
  onClose: () => void;
}) {
  const { colors, size } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={image !== null}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top + size.topPaddingSubPage,
            paddingBottom: insets.bottom,
            backgroundColor: colors.bg,
          },
        ]}
      >
        <View
          style={[
            styles.close,
            {
              paddingHorizontal: size.sidePadding,
              height: size.touchTargetMin,
            },
          ]}
        >
          <HeaderIconButton label="Close screenshot" onPress={onClose}>
            <CloseIcon color={colors.text} size={20} />
          </HeaderIconButton>
        </View>
        {image !== null && (
          <Image
            accessibilityLabel="Screenshot, full screen"
            source={{ uri: photoUri(image) }}
            resizeMode="contain"
            style={styles.image}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  close: {
    alignItems: 'flex-end',
  },
  image: {
    flex: 1,
    width: '100%',
  },
});
