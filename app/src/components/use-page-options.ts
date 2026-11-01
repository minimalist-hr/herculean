import { useTheme } from '@/theme/theme-provider';

/** The options every stack of pages shares. */
export function usePageOptions() {
  const { colors } = useTheme();

  return {
    headerShown: false,
    contentStyle: { backgroundColor: colors.bg },
    // Pages cross-fade. A slide on Android shows the leaving page empty while it slides out.
    animation: 'fade',
  } as const;
}
