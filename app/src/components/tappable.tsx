import {
  // eslint-disable-next-line no-restricted-imports -- the one place that wraps it.
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme/theme-provider';

interface TappableProps extends Omit<PressableProps, 'style'> {
  /** Dim suits buttons and icons. Fill suits a whole row. None suits a backdrop. */
  feedback?: 'dim' | 'fill' | 'none';
  style?: StyleProp<ViewStyle>;
}

/** Anything that can be tapped. It reacts while pressed, so every action answers the finger. */
export function Tappable({ feedback = 'dim', style, ...props }: TappableProps) {
  const { colors, opacity } = useTheme();
  const pressedStyle = {
    dim: { opacity: opacity.pressed },
    fill: { backgroundColor: colors.raised },
    none: undefined,
  }[feedback];

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [style, pressed && pressedStyle]}
    />
  );
}
