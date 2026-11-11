import { Tabs } from 'expo-router/tabs';
import { StyleSheet, View } from 'react-native';

import { InTabsContext, setTabBarHeight } from '@/components/above-tab-bar';
import {
  FeedbackIcon,
  OverviewIcon,
  SettingsIcon,
  UsersIcon,
} from '@/components/icons';
import { notifyFailure } from '@/components/notifications';
import { TabBar, tabScreenOptions } from '@/components/tab-bar';
import { useSystemHealth } from '@/features/admin/use-system-health';

export default function AdminTabsLayout() {
  // Checked while the admin area is open, so the Settings tab shows when something is down.
  const health = useSystemHealth();
  const down =
    health.data?.services.some((service) => service.status === 'down') === true;

  return (
    <InTabsContext.Provider value>
      <View style={styles.tabs}>
        <Tabs
          tabBar={(props) => (
            <View
              onLayout={(event) => {
                setTabBarHeight(event.nativeEvent.layout.height);
              }}
            >
              <TabBar {...props} />
            </View>
          )}
          screenOptions={tabScreenOptions}
        >
          <Tabs.Screen
            name="index"
            options={{ title: 'Overview', tabBarIcon: OverviewIcon }}
          />
          <Tabs.Screen
            name="feedback"
            options={{ title: 'Feedback', tabBarIcon: FeedbackIcon }}
          />
          <Tabs.Screen
            name="users"
            options={{ title: 'Users', tabBarIcon: UsersIcon }}
            listeners={{
              tabPress: (event) => {
                event.preventDefault();
                notifyFailure('Users comes in a later update.');
              },
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: SettingsIcon,
              tabBarBadge: down ? 'system down' : undefined,
            }}
          />
        </Tabs>
      </View>
    </InTabsContext.Provider>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
  },
});
