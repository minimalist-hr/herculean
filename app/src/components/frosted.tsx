import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { tokens } from '@/theme/tokens';

// Android blurs only what sits in a blur target, so there the surface is just a little see-through.
const canBlur = Platform.OS !== 'android';

type Corners = Pick<
  ViewStyle,
  'borderRadius' | 'borderTopLeftRadius' | 'borderTopRightRadius'
>;

/** A surface's color: clear in glass themes, where Frosted draws it instead. */
export function useSurfaceColor(color: string) {
  return useTheme().glass ? 'transparent' : color;
}

/** In glass themes, a blur of what is behind, with the surface color over it. Put it first inside a surface whose color comes from useSurfaceColor. */
export function Frosted({
  color,
  corners,
}: {
  color: string;
  /** The surface's corners, so the blur keeps inside them. */
  corners?: Corners;
}) {
  const { glass, scheme } = useTheme();
  if (!glass) {
    return null;
  }

  return (
    <View
      testID="frosted"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.clip, corners]}
    >
      {canBlur && (
        <BlurView
          tint={scheme}
          intensity={tokens.glass.blur}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: color,
            opacity: canBlur
              ? tokens.glass.opacity.blurred
              : tokens.glass.opacity.plain,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
