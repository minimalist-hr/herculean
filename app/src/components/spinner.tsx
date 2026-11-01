import { useEffect, useState } from 'react';
import { Animated, Platform, type ColorValue } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { SpinnerArcIcon } from './icons';
import { useReduceMotion } from './use-reduce-motion';

/** Turns while something waits on the server. Stands still when the phone asks for reduced motion. */
export function Spinner({ color }: { color: ColorValue }) {
  const { motion, size } = useTheme();
  const reduceMotion = useReduceMotion();
  const [turn] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: motion.spinMs,
        // The same speed all the way round.
        easing: (progress) => progress,
        // The web has no native animation driver.
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [reduceMotion, turn, motion.spinMs]);

  const rotate = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View testID="spinner" style={{ transform: [{ rotate }] }}>
      <SpinnerArcIcon color={color} size={size.spinner} />
    </Animated.View>
  );
}
