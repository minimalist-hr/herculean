import { Tabs } from 'expo-router/tabs';

import {
  ExercisesIcon,
  HomeIcon,
  RoutinesIcon,
  WorkoutIcon,
} from '@/components/icons';
import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
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
  );
}
