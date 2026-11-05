import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

const stripeWidth = 26;
const endSpace = 16;

/** The group of connected exercises, written up the block's right edge. A name too long for the block ends in "…". */
export function GroupStripe({ name }: { name: string }) {
  const { colors, text } = useTheme();
  const [height, setHeight] = useState(0);

  return (
    <View
      onLayout={(event) => {
        setHeight(event.nativeEvent.layout.height);
      }}
      style={[
        styles.stripe,
        { borderLeftColor: colors.border, backgroundColor: colors.raised },
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
          {name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stripe: {
    width: stripeWidth,
    borderLeftWidth: 1,
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
