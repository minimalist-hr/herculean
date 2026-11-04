import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { ChevronLeftIcon } from './icons';
import { Tappable } from './tappable';

/** The link at the top of a sub-page, named after the screen it goes back to. */
export function BackLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors, size, space, text } = useTheme();

  return (
    <Tappable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.link,
        // The padding widens the touch target without moving the label off the edge.
        {
          height: size.touchTargetMin,
          paddingHorizontal: space.sm,
          marginLeft: -space.sm,
        },
      ]}
    >
      <ChevronLeftIcon color={colors.muted} size={16} />
      <Text
        numberOfLines={1}
        style={[text.secondaryButton, styles.label, { color: colors.muted }]}
      >
        {label}
      </Text>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  label: {
    flexShrink: 1,
  },
});
