import { Easing, FadeIn, FadeOut } from 'react-native-reanimated';

import { tokens } from './tokens';

/** The one curve every motion uses: quick to start, gentle to land. */
export const motionCurve = [0.33, 1, 0.68, 1] as const;

export const motionEasing = Easing.bezier(...motionCurve);

/** How small things appear: a card replacing its skeleton, a set or an exercise added. Reduce motion turns it off. */
export const appear = FadeIn.duration(tokens.motion.fastMs).easing(
  motionEasing,
);

/** How small things go: a set or an exercise removed. Reduce motion turns it off. */
export const disappear = FadeOut.duration(tokens.motion.fastMs).easing(
  motionEasing,
);
