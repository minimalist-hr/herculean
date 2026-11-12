import { usePathname } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { motionEasing } from '@/theme/motion';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { setTabBarHeight } from './above-tab-bar';
import { Tappable } from './tappable';
import { useReduceMotion } from './use-reduce-motion';

/**
 * Leaving a tab returns it to its first page, so a tab always opens there.
 * Tabs fade like pages. Every tab is ready from the start, so the first switch fades like every other.
 */
export const tabScreenOptions = {
  headerShown: false,
  popToTopOnBlur: true,
  lazy: false,
  animation: 'fade',
  transitionSpec: {
    animation: 'timing',
    config: { duration: tokens.motion.standardMs },
  },
} as const;

/** Keeps a tab's first page under a page opened from another tab, so leaving the tab can return to it. */
export const tabStackSettings = { anchor: 'index' };

/** Only a tab's first page shows the tabs. Every page with a back link hides them: you go back. */
const tabPages = [
  '/',
  '/workout',
  '/routines',
  '/exercises',
  '/admin',
  '/admin/feedback',
  '/admin/users',
  '/admin/settings',
];

export function hidesTabBar(pathname: string) {
  return !tabPages.includes(pathname);
}

/**
 * The tab bar floats over the bottom of the tabs, fades out on pages with a back link,
 * and fades back in on a tab's first page. No page changes size, so nothing jumps.
 */
export function FloatingTabBar(props: BottomTabBarProps) {
  const { motion } = useTheme();
  const reduceMotion = useReduceMotion();
  const hidden = hidesTabBar(usePathname());
  const shown = useSharedValue(hidden ? 0 : 1);

  useEffect(() => {
    shown.set(
      withTiming(hidden ? 0 : 1, {
        duration: reduceMotion ? 0 : motion.standardMs,
        easing: motionEasing,
      }),
    );
  }, [hidden, motion.standardMs, reduceMotion, shown]);

  const fade = useAnimatedStyle(() => ({ opacity: shown.get() }));

  return (
    <Animated.View
      pointerEvents={hidden ? 'none' : 'auto'}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      onLayout={(event) => {
        setTabBarHeight(event.nativeEvent.layout.height);
      }}
      style={[styles.floating, fade]}
    >
      <TabBar {...props} />
    </Animated.View>
  );
}

function TabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { colors, radius, size, text } = useTheme();
  const { tabBar } = size;

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
        // A tab's badge is a dot that needs attention, and its text says why to screen readers.
        const badge =
          typeof options.tabBarBadge === 'string'
            ? options.tabBarBadge
            : undefined;
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
            accessibilityLabel={
              badge === undefined ? label : `${label}, ${badge}`
            }
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={[styles.item, { height: size.tabItem, gap: tabBar.iconGap }]}
          >
            <View>
              {options.tabBarIcon?.({ focused, color, size: tabBar.iconSize })}
              {badge !== undefined && (
                <View
                  testID="tab-badge"
                  style={[
                    styles.badge,
                    {
                      width: badgeSize,
                      height: badgeSize,
                      borderRadius: radius.check,
                      backgroundColor: colors.danger,
                    },
                  ]}
                />
              )}
            </View>
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

/** The size of a status dot. */
const badgeSize = 8;

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  badge: {
    position: 'absolute',
    top: -badgeSize / 4,
    right: -badgeSize,
  },
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
