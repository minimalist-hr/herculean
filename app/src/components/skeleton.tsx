import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Platform, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { useReduceMotion } from './use-reduce-motion';

/** What a line of each text style takes, so nothing moves when the real text arrives. */
export const textLine = {
  eyebrow: 16,
  meta: 16,
  listItemName: 21,
  cardTitle: 29,
  bigStat: 31,
  pageTitle: 34,
};

/** A block in the shape of content that is loading. It pulses gently, and stands still when the phone asks for reduced motion. */
export function Skeleton({
  width,
  height,
}: {
  /** A number, or the full width it sits in. */
  width: number | '100%';
  height: number;
}) {
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
        maxWidth: '100%',
        height,
        opacity: pulse,
        borderRadius: radius.pill,
        backgroundColor: colors.raised,
      }}
    />
  );
}

/** A skeleton in the room a line of text takes. */
export function SkeletonLine({
  width,
  height,
  lineHeight,
}: {
  width: number;
  height: number;
  lineHeight: number;
}) {
  return (
    <View style={{ height: lineHeight, justifyContent: 'center' }}>
      <Skeleton width={width} height={height} />
    </View>
  );
}

/** A text field while its value loads: its label and helper, with a block for the input. */
export function FieldSkeleton({
  label,
  helper,
}: {
  label: string;
  helper?: string;
}) {
  const { size, space, text } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      <Text style={text.eyebrow}>{label}</Text>
      <Skeleton width="100%" height={size.input} />
      {helper !== undefined && <Text style={text.meta}>{helper}</Text>}
    </View>
  );
}

/** Skeletons that a screen reader announces once, as one thing loading. */
export function SkeletonGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
    >
      {children}
    </View>
  );
}
