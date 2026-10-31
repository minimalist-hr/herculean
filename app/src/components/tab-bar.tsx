import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

export function TabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { colors, size, text } = useTheme();
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
          <Pressable
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
          </Pressable>
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
