import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { motionEasing } from '@/theme/motion';
import { tokens } from '@/theme/tokens';

const fadeIn = FadeIn.duration(tokens.motion.standardMs).easing(motionEasing);
const fadeOut = FadeOut.duration(tokens.motion.standardMs).easing(motionEasing);

/**
 * Something floating over a page, such as the rest bar, that fades in when it appears and fades out when it goes.
 * It covers its parent without catching touches, so what it holds keeps its own position. Reduce motion turns it off.
 */
export function Floating({ children }: { children: ReactNode }) {
  return (
    <Animated.View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      entering={fadeIn}
      exiting={fadeOut}
    >
      {children}
    </Animated.View>
  );
}
