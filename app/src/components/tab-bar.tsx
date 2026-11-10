import { usePathname } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { Tappable } from './tappable';

/** Leaving a tab returns it to its first page, so a tab always opens there. */
export const tabScreenOptions = { headerShown: false, popToTopOnBlur: true };

/** Keeps a tab's first page under a page opened from another tab, so leaving the tab can return to it. */
export const tabStackSettings = { anchor: 'index' };

/** Only a tab's first page shows the tabs. Every page with a back link hides them: you go back. */
const tabPages = ['/', '/workout', '/routines', '/exercises'];

export function hidesTabBar(pathname: string) {
  return !tabPages.includes(pathname);
}

export function TabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { colors, size, text } = useTheme();
  const { tabBar } = size;
  const pathname = usePathname();

  if (hidesTabBar(pathname)) {
    return null;
  }

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Main"
      style={[
        styles.bar,
        {
          paddingTop: tabBar.paddingTop,
          paddingHorizontal: tabBar.paddingX,
          // Clears the home indicator on phones that have one.
          paddingBottom: Math.max(insets.bottom, tabBar.paddingBottomMin),
          borderTopColor: colors.border,
          backgroundColor: colors.bg,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const focused = state.index === index;
        const color = focused ? colors.primaryText : colors.muted;

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        return (
          <Tappable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={[styles.item, { height: size.tabItem, gap: tabBar.iconGap }]}
          >
            {options.tabBarIcon?.({ focused, color, size: tabBar.iconSize })}
            <Text
              style={[
                focused ? text.tabLabelActive : text.tabLabelInactive,
                { color },
              ]}
            >
              {label}
            </Text>
          </Tappable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
