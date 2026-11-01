import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { useTheme } from '@/theme/theme-provider';

// The pillar H is drawn in em of the wordmark's font size, so the logo scales as one piece.
const markWidthEm = 0.81;
const markHeightEm = 0.91;
const markGapBeforeEm = 0.03;
const markGapAfterEm = 0.18;

/** The Herculean logo: the pillar H, then ERCU and LEAN in the accent. */
export function Wordmark() {
  const { colors, text } = useTheme();
  const fontSize = text.wordmark.fontSize ?? 0;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Herculean"
      style={styles.row}
    >
      <Svg
        width={fontSize * markWidthEm}
        height={fontSize * markHeightEm}
        viewBox="-4 0 89 100"
        style={{
          marginLeft: fontSize * markGapBeforeEm,
          marginRight: fontSize * markGapAfterEm,
        }}
      >
        <Polygon
          points="0,0 19.4,0 23.4,4 23.4,9 19.4,9 19.4,91 23.4,91 23.4,96 19.4,100 0,100 -4,96 -4,91 0,91 0,9 -4,9 -4,4"
          fill={colors.text}
        />
        <Polygon
          points="61.6,0 81.0,0 85.0,4 85.0,9 81.0,9 81.0,91 85.0,91 85.0,96 81.0,100 61.6,100 57.6,96 57.6,91 61.6,91 61.6,9 57.6,9 57.6,4"
          fill={colors.text}
        />
        <Polygon
          points="19.4,44 61.6,32 61.6,56 19.4,68"
          fill={colors.primary}
        />
      </Svg>
      <Text style={[text.wordmark, { color: colors.text }]}>
        ERCU<Text style={{ color: colors.primaryText }}>LEAN</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // The capitals sit in the middle of the text's line, so centering puts ERCULEAN in the middle of the H.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
