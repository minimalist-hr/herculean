import { Tabs } from 'expo-router/tabs';
import { StyleSheet, View } from 'react-native';

import { InTabsContext, setTabBarHeight } from '@/components/above-tab-bar';
import {
  ExercisesIcon,
  HomeIcon,
  RoutinesIcon,
  WorkoutIcon,
} from '@/components/icons';
import { TabBar, tabScreenOptions } from '@/components/tab-bar';
import { useKeepTimeZone } from '@/features/account/use-keep-time-zone';
import { useOpenFromRestAlert } from '@/features/workout/rest-alert';
import { ResumeBar } from '@/features/workout/resume-bar';

export default function TabsLayout() {
  useKeepTimeZone();
  useOpenFromRestAlert();

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
            options={{ title: 'Home', tabBarIcon: HomeIcon }}
          />
          <Tabs.Screen
            name="workout"
            options={{ title: 'Workout', tabBarIcon: WorkoutIcon }}
          />
          <Tabs.Screen
            name="routines"
            options={{ title: 'Routines', tabBarIcon: RoutinesIcon }}
          />
          <Tabs.Screen
            name="exercises"
            options={{ title: 'Exercises', tabBarIcon: ExercisesIcon }}
          />
        </Tabs>
        <ResumeBar />
      </View>
    </InTabsContext.Provider>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
  },
});
