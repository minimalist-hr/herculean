import { useState, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme/theme-provider';

export const stripeWidth = 26;
const endSpace = 16;

/** Marks a superset: "Superset" written up the block's right edge. */
export function SupersetStripe({
  edge,
  style,
}: {
  /** Closes the block on the right, in this border color, for cards that have their own borders. */
  edge?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, line, radius, text } = useTheme();
  const [height, setHeight] = useState(0);

  return (
    <View
      onLayout={(event) => {
        setHeight(event.nativeEvent.layout.height);
      }}
      style={[
        styles.stripe,
        {
          borderLeftWidth: line,
          borderLeftColor: colors.border,
          backgroundColor: colors.raised,
        },
        edge !== undefined && {
          borderLeftWidth: 0,
          borderTopWidth: line,
          borderRightWidth: line,
          borderBottomWidth: line,
          borderColor: edge,
          borderTopRightRadius: radius.card,
          borderBottomRightRadius: radius.card,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.turned,
          {
            width: height,
            left: (stripeWidth - height) / 2,
            top: (height - stripeWidth) / 2,
            paddingHorizontal: endSpace / 2,
          },
        ]}
      >
        <Text numberOfLines={1} style={[text.dayName, styles.name]}>
          Superset
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
  },
  cards: {
    flex: 1,
  },
  stripe: {
    width: stripeWidth,
    overflow: 'hidden',
  },
  turned: {
    position: 'absolute',
    height: stripeWidth,
    justifyContent: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  name: {
    textAlign: 'center',
  },
});

/** Where a card sits in a superset block: the first or the second. */
export type BlockPlace = 'first' | 'second';

/** The place of a block's card at this row, or none when the block is one exercise. */
export function placeIn(block: unknown[], row: number): BlockPlace | undefined {
  if (block.length < 2) {
    return undefined;
  }

  return row === 0 ? 'first' : 'second';
}

/** A card in a superset block: joined to the other, with square corners where the stripe or the other card meets it. */
export function blockCardStyle(
  place: BlockPlace | undefined,
  cardRadius: number,
  striped = true,
) {
  if (place === undefined) {
    return {};
  }

  return {
    marginTop: place === 'second' ? -1 : 0,
    borderTopLeftRadius: place === 'first' ? cardRadius : 0,
    borderBottomLeftRadius: place === 'second' ? cardRadius : 0,
    borderTopRightRadius: !striped && place === 'first' ? cardRadius : 0,
    borderBottomRightRadius: !striped && place === 'second' ? cardRadius : 0,
  };
}

/** A superset's two cards as one block, with its stripe beside them while closed. Open cards need the room, so they go without. */
export function SupersetBlock({
  open = false,
  children,
}: {
  /** Its cards are open, so the block keeps their outline and room. */
  open?: boolean;
  children: ReactNode;
}) {
  const { colors, space } = useTheme();

  return (
    <View style={[styles.block, open && { marginVertical: space.sm }]}>
      <View style={styles.cards}>{children}</View>
      {!open && <SupersetStripe edge={colors.border} />}
    </View>
  );
}
