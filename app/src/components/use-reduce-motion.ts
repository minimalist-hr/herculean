import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Whether the phone asks for reduced motion. */
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
