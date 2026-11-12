import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '@/components/card';
import { notifyFailure } from '@/components/notifications';
import { linkTextHeight, TextLink } from '@/components/text-link';
import { useTheme } from '@/theme/theme-provider';

import { blockedMessage } from './feedback-labels';
import { useFeedbackBlocked } from './use-feedback';

/** The end of Home: a quick way to send feedback. It works before anything loads, and looks muted once the user is blocked. */
export function FeedbackCard() {
  const router = useRouter();
  const { colors, size, space, text } = useTheme();
  const blocked = useFeedbackBlocked().data === true;
  // The link keeps its full touch area, but the card's padding below it stays even.
  const linkOverhang = (size.touchTargetMin - linkTextHeight) / 2;

  return (
    <Card>
      <Text style={[text.listItemName, { color: colors.text }]}>
        Something off or missing?
      </Text>
      {/* Its side padding widens the touch area, so it starts in line with the title. */}
      <View
        style={{
          marginLeft: -space.sm,
          marginBottom: -linkOverhang,
          alignItems: 'flex-start',
        }}
      >
        <TextLink
          label="Send feedback"
          muted={blocked}
          onPress={() => {
            if (blocked) {
              notifyFailure(blockedMessage);
              return;
            }

            router.push({
              pathname: '/settings/feedback/new',
              params: { from: 'home' },
            });
          }}
        />
      </View>
    </Card>
  );
}
