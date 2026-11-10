import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CameraIcon, ImageIcon, TrashIcon } from '@/components/icons';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { Sheet } from '@/components/sheet';
import { Tappable } from '@/components/tappable';
import { useTheme } from '@/theme/theme-provider';

import { pickPhoto, type PhotoSource } from './pick-photo';
import {
  useRemoveUserPhoto,
  useSaveUserPhoto,
  useUserPhoto,
} from './use-user-photo';

const deniedMessages: Record<PhotoSource, string> = {
  camera: 'Allow camera access in your phone’s settings.',
  library: 'Allow photo access in your phone’s settings.',
};

/** Take, choose or remove the profile photo. It stays open behind the picker, and closes once a photo is chosen. */
export function ProfilePhotoSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, opacity } = useTheme();
  const photo = useUserPhoto();
  const save = useSaveUserPhoto();
  const remove = useRemoveUserPhoto();
  const current = photo.data?.image ?? null;

  function savePhoto(image: string) {
    save.mutate(image, {
      onSuccess: () => {
        notifySuccess('Photo saved.');
      },
      onError: () => {
        notifyFailure('Couldn’t save the photo. Try again.');
      },
    });
  }

  async function choose(source: PhotoSource) {
    dismissNotification();
    try {
      const picked = await pickPhoto(source);
      if (picked.kind === 'denied') {
        notifyFailure(deniedMessages[source]);
      } else if (picked.kind === 'picked') {
        onClose();
        savePhoto(picked.image);
      }
    } catch {
      onClose();
      notifyFailure('Couldn’t save the photo. Try again.');
    }
  }

  function removePhoto() {
    if (current === null) {
      notifyFailure('There is no photo to remove.');
      return;
    }

    dismissNotification();
    onClose();
    remove.mutate(undefined, {
      onSuccess: () => {
        notifySuccess('Photo removed.', {
          label: 'Undo',
          onPress: () => {
            savePhoto(current);
          },
        });
      },
      onError: () => {
        notifyFailure('Couldn’t remove the photo. Try again.');
      },
    });
  }

  return (
    <Sheet
      visible={visible}
      title="Profile photo"
      message="Shown on Home and in Profile."
      onClose={onClose}
      body={
        <View>
          <PhotoRow
            first
            icon={<CameraIcon color={colors.text} />}
            label="Take photo"
            onPress={() => void choose('camera')}
          />
          <PhotoRow
            icon={<ImageIcon color={colors.text} />}
            label="Choose from library"
            onPress={() => void choose('library')}
          />
          <View style={current === null && { opacity: opacity.dimmed }}>
            <PhotoRow
              danger
              icon={<TrashIcon color={colors.danger} />}
              label="Remove photo"
              onPress={removePhoto}
            />
          </View>
        </View>
      }
    />
  );
}

function PhotoRow({
  icon,
  label,
  first = false,
  danger = false,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  first?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  const { colors, size, space, text } = useTheme();

  return (
    <Tappable
      feedback="fill"
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.row,
        {
          gap: space.md,
          minHeight: size.listRowMin,
          borderTopWidth: first ? 0 : 1,
          borderColor: colors.border,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          text.listItemName,
          { color: danger ? colors.danger : colors.text },
        ]}
      >
        {label}
      </Text>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
