import { useTheme } from '@/theme/theme-provider';

/** The options every stack of pages shares. */
export function usePageOptions() {
  const { colors, motion } = useTheme();

  return {
    headerShown: false,
    contentStyle: { backgroundColor: colors.bg },
    // Pages fade in and out, like tabs, the same way on every phone.
    animation: 'fade',
    animationDuration: motion.standardMs,
  } as const;
}
