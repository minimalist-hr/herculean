import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '@/components/card';
import { linkTextHeight, TextLink } from '@/components/text-link';
import { useTheme } from '@/theme/theme-provider';

/** The end of Home: a quick way to send feedback. It needs nothing loaded. */
export function FeedbackCard() {
  const router = useRouter();
  const { colors, size, space, text } = useTheme();
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
          onPress={() => {
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
