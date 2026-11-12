import { useQueryClient } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePullToRefresh } from '@/components/pull-to-refresh';
import { usePageEnd } from '@/components/above-tab-bar';
import { useCurrentUser } from '@/features/account/use-current-user';
import { AnnouncementCard } from '@/features/announcement/announcement-card';
import { announcementKeys } from '@/features/announcement/use-announcement';
import { FeedbackCard } from '@/features/feedback/feedback-card';
import { ProfileButton } from '@/features/settings/profile-button';
import { dateText } from '@/formats/dates';
import { workoutKeys } from '@/features/workout/query-keys';
import { useDayRefresh } from '@/features/workout/use-day-refresh';
import { useTheme } from '@/theme/theme-provider';

import {
  MonthSection,
  RecordsSection,
  StreakSection,
  TodaySection,
  WeekSection,
} from './home-sections';

const afternoonFrom = 12;
const eveningFrom = 18;

function greeting(hour: number, name?: string | null) {
  let timeOfDay = 'evening';
  if (hour < afternoonFrom) {
    timeOfDay = 'morning';
  } else if (hour < eveningFrom) {
    timeOfDay = 'afternoon';
  }

  const firstName = name?.trim().split(/\s+/)[0];

  return firstName ? `Good ${timeOfDay}, ${firstName}` : `Good ${timeOfDay}`;
}

/** Home: what to do today, whether you're on track, and whether you're getting stronger. */
export function HomeScreen() {
  const { colors, size, space, text } = useTheme();
  const pageEnd = usePageEnd();
  const { now, refresh } = useDayRefresh();
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const refreshControl = usePullToRefresh(() =>
    Promise.all([
      refresh(),
      queryClient.invalidateQueries({ queryKey: workoutKeys.inProgress }),
      queryClient.invalidateQueries({ queryKey: workoutKeys.all }),
      queryClient.invalidateQueries({ queryKey: announcementKeys.all }),
    ]),
  );

  return (
    <ScrollView
      testID="home-scroll"
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={{
        gap: space.xl,
        paddingTop: size.topPaddingTab,
        paddingHorizontal: size.sidePadding,
        paddingBottom: pageEnd,
      }}
      refreshControl={refreshControl}
    >
      <View style={[styles.header, { gap: space.md }]}>
        {/* One line before the avatar. A long name shrinks it instead of wrapping. */}
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={[text.greeting, styles.title, { color: colors.text }]}
        >
          {greeting(now.getHours(), user.data?.name)}
        </Text>
        <ProfileButton />
      </View>
      <AnnouncementCard />
      <TodaySection today={dateText(now)} />
      <WeekSection now={now} />
      <MonthSection now={now} />
      <StreakSection />
      <RecordsSection />
      <FeedbackCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flexShrink: 1,
  },
});
