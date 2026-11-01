import { useEffect, useState } from 'react';
import { Animated, Platform } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { useReduceMotion } from './use-reduce-motion';

/** A block in the shape of content that is loading. It pulses gently, and stands still when the phone asks for reduced motion. */
export function Skeleton({ width, height }: { width: number; height: number }) {
  const { colors, motion, opacity, radius } = useTheme();
  const reduceMotion = useReduceMotion();
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }

    // The web has no native animation driver.
    const useNativeDriver = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: opacity.pulse,
          duration: motion.pulseMs / 2,
          useNativeDriver,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: motion.pulseMs / 2,
          useNativeDriver,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [reduceMotion, pulse, motion.pulseMs, opacity.pulse]);

  return (
    <Animated.View
      style={{
        width,
        height,
        opacity: pulse,
        borderRadius: radius.pill,
        backgroundColor: colors.raised,
      }}
    />
  );
}
