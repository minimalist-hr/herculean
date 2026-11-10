import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { OpenOutIcon } from './icons';
import { Tappable } from './tappable';
import { useTheme } from '@/theme/theme-provider';

/** A name inside a card or table that opens its page, marked with the open-out icon. */
export function NameLink({
  name,
  style,
  onPress,
  children,
}: {
  name: string;
  /** The name's text style, for example a card title. */
  style: object;
  onPress: () => void;
  /** Shows under the name, inside the same link. */
  children?: ReactNode;
}) {
  const { colors, space } = useTheme();

  return (
    <Tappable
      accessibilityRole="link"
      accessibilityLabel={`${name} details`}
      hitSlop={space.sm}
      onPress={onPress}
      style={styles.link}
    >
      {/* The space keeps the icon with the last word when the name wraps. */}
      <Text style={[style, { color: colors.text }]}>
        {`${name} `}
        <OpenOutIcon color={colors.muted} size={14} />
      </Text>
      {children}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'flex-start',
  },
});
