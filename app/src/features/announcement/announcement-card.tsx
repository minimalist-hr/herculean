import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/card';
import { CloseIcon } from '@/components/icons';
import { Tappable } from '@/components/tappable';
import { useTheme } from '@/theme/theme-provider';

import { useAnnouncement, useClosedAnnouncement } from './use-announcement';

/** How an announcement looks: its title, its text, and an X when it can be closed. */
export function AnnouncementView({
  title,
  text: body,
  onClose,
}: {
  title: string;
  text: string;
  /** Without it, as in the admin's preview, there is no X. */
  onClose?: () => void;
}) {
  const { colors, space, text } = useTheme();

  return (
    <Card>
      <View style={{ gap: space.xxs }}>
        <View style={[styles.heading, { gap: space.sm }]}>
          <Text
            style={[text.listItemName, styles.title, { color: colors.text }]}
          >
            {title}
          </Text>
          {onClose !== undefined && (
            <Tappable
              accessibilityRole="button"
              accessibilityLabel="Close the announcement"
              hitSlop={space.md}
              onPress={onClose}
            >
              <CloseIcon color={colors.muted} size={18} />
            </Tappable>
          )}
        </View>
        <Text style={[text.body, { color: colors.muted }]}>{body}</Text>
      </View>
    </Card>
  );
}

/** Minimalist's announcement on Home, until this phone closes it. It shows only once loaded, never on failure. */
export function AnnouncementCard() {
  const announcement = useAnnouncement().data;
  const { closedId, close } = useClosedAnnouncement();

  if (
    announcement === undefined ||
    announcement === null ||
    closedId === undefined ||
    closedId === announcement.id
  ) {
    return null;
  }

  return (
    <AnnouncementView
      title={announcement.title}
      text={announcement.text}
      onClose={() => {
        close(announcement.id);
      }}
    />
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
  },
});
