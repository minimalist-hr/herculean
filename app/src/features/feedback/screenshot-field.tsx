import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ImageIcon } from '@/components/icons';
import { notifyFailure } from '@/components/notifications';
import { TextLink } from '@/components/text-link';
import { photoUri } from '@/features/settings/use-user-photo';
import { useTheme } from '@/theme/theme-provider';

import { pickScreenshots } from './pick-screenshots';

export const maxScreenshots = 4;

const tooManyMessage = `At most ${String(maxScreenshots)} screenshots.`;

/** Adds screenshots from the phone's photos, up to 4 in all. When it can't, `add` says why. */
export function useAddScreenshots(
  images: string[],
  onChange: (images: string[]) => void,
  /** Why it can't be used now, for example on a closed ticket. */
  mutedReason?: string,
) {
  const reason =
    mutedReason ??
    (images.length >= maxScreenshots ? tooManyMessage : undefined);

  async function pick() {
    try {
      const picked = await pickScreenshots(maxScreenshots - images.length);
      if (picked.kind === 'picked') {
        onChange([...images, ...picked.images]);
      } else if (picked.kind === 'denied') {
        notifyFailure('Allow photo access in your phone’s settings.');
      }
    } catch {
      notifyFailure('Couldn’t add the screenshot. Try another.');
    }
  }

  return {
    reason,
    add: () => {
      if (reason === undefined) {
        void pick();
      } else {
        notifyFailure(reason);
      }
    },
  };
}

/** Up to 4 square tiles in equal columns, so they line up however many there are. */
export function ScreenshotGrid({ tiles }: { tiles: ReactNode[] }) {
  const { space } = useTheme();
  const slots = Array.from(
    { length: maxScreenshots },
    (_, index) => tiles[index] ?? null,
  );

  return (
    <View style={[styles.grid, { gap: space.sm }]}>
      {slots.map((tile, index) => (
        <View key={index} style={styles.slot}>
          {tile}
        </View>
      ))}
    </View>
  );
}

/** Screenshots on a message being written, each with Remove. */
export function DraftScreenshots({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const { colors, radius, space } = useTheme();

  if (images.length === 0) {
    return null;
  }

  return (
    <ScreenshotGrid
      tiles={images.map((image, index) => (
        <View key={index} style={[styles.draft, { gap: space.xxs }]}>
          <Image
            accessibilityLabel={`Screenshot ${String(index + 1)}`}
            source={{ uri: photoUri(image) }}
            style={[
              styles.square,
              {
                borderRadius: radius.control,
                borderColor: colors.border,
              },
            ]}
          />
          <TextLink
            label="Remove"
            accessibilityLabel={`Remove screenshot ${String(index + 1)}`}
            onPress={() => {
              onChange(images.filter((_, other) => other !== index));
            }}
          />
        </View>
      ))}
    />
  );
}

/** The screenshots on new feedback, and Add screenshot below them. */
export function ScreenshotField({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const { space } = useTheme();
  const { reason, add } = useAddScreenshots(images, onChange);

  return (
    <View style={{ gap: space.sm }}>
      <DraftScreenshots images={images} onChange={onChange} />
      <Button
        label="Add screenshot"
        variant="secondary"
        icon={ImageIcon}
        muted={reason !== undefined}
        onPress={add}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
  },
  slot: {
    flex: 1,
  },
  draft: {
    alignItems: 'center',
  },
  square: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 1,
  },
});
