import { usePathname } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';

import { useAboveTabBar } from './above-tab-bar';
import { PlusIcon } from './icons';
import { hidesTabBar } from './tab-bar';
import { Tappable } from './tappable';

/** The room a list keeps after its content, so the New button never covers its last row. */
export function useNewButtonRoom() {
  const { size, space } = useTheme();

  return size.newButton + space.sm;
}

/** A list's New action: a square + at the bottom right, above the tab bar and any floating bar. */
export function NewButton({
  label,
  muted = false,
  onPress,
}: {
  /** What it makes, for example "New exercise". */
  label: string;
  /** Looks unavailable but still takes a press, which says why. */
  muted?: boolean;
  onPress: () => void;
}) {
  const { colors, opacity, radius, size, space } = useTheme();
  const { tabBar, floatingRoom } = useAboveTabBar();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const withoutTabs = hidesTabBar(pathname);
  // The tab bar floats over the page, so the button sits above it, and above a floating bar on it.
  const below = withoutTabs ? insets.bottom : tabBar;
  const gap =
    !withoutTabs && floatingRoom > 0 ? floatingRoom + space.sm : space.lg;

  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.button,
        {
          right: size.sidePadding,
          bottom: below + gap,
          width: size.newButton,
          height: size.newButton,
          borderRadius: radius.control,
          backgroundColor: colors.primary,
          opacity: muted ? opacity.dimmed : 1,
        },
      ]}
    >
      <PlusIcon color={colors.onPrimary} size={20} />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
