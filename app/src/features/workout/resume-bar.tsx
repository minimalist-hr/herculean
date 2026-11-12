import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Floating } from '@/components/floating';
import { Frosted, useSurfaceColor } from '@/components/frosted';

import { setFloatingRoom, useAboveTabBar } from '@/components/above-tab-bar';
import { hidesTabBar } from '@/components/tab-bar';
import { Button } from '@/components/button';
import { ChevronDownIcon, WorkoutIcon } from '@/components/icons';
import { ProgressBar } from '@/components/progress-bar';
import { Tappable } from '@/components/tappable';
import { formatClock } from '@/formats/formats';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { barHitSlop, restBarRoom } from './rest-bar';
import { useElapsed } from './use-elapsed';
import { useResumeBarHidden } from './use-resume-bar-hidden';
import { useWorkout } from './use-workout';
import { useWorkoutInProgress } from './use-workout-in-progress';
import { progressText, workoutProgress } from './workout-progress';

const barGap = 4;
const hideWidth = 28;
const progressHeight = 4;

/** Takes you back to the workout in progress from any tab, floating above the tab bar and any action box on it. It stays hidden while it loads, if it fails, and while you log. */
export function ResumeBar() {
  const pathname = usePathname();
  const inProgress = useWorkoutInProgress().data;
  const shown = Boolean(inProgress) && !hidesTabBar(pathname);

  useEffect(() => {
    if (!shown) {
      setFloatingRoom(0);
    }
  }, [shown]);

  if (!inProgress || !shown) {
    return null;
  }

  return <ResumeBarContent id={inProgress.id} name={inProgress.name} />;
}

function ResumeBarContent({ id, name }: { id: string; name: string }) {
  const { colors, line, radius, size, space, text } = useTheme();
  const router = useRouter();
  const { tabBar } = useAboveTabBar();
  const workout = useWorkout(id).data;
  const elapsed = useElapsed(workout?.startedAtUtc);
  const { hidden, setHidden } = useResumeBarHidden(id);
  const ready = workout !== undefined && hidden !== undefined;
  const surface = useSurfaceColor(colors.raised);

  useEffect(() => {
    setFloatingRoom(
      ready ? (hidden ? restBarRoom.hidden : restBarRoom.open) : 0,
    );
  }, [hidden, ready]);

  if (!ready) {
    return null;
  }

  const progress = workoutProgress(workout.exercises);
  const sets = progressText(progress);
  const box = {
    bottom: tabBar + space.sm,
    borderRadius: radius.card,
    borderColor: colors.border,
    backgroundColor: surface,
  };
  const frosted = (
    <Frosted color={colors.raised} corners={{ borderRadius: radius.card }} />
  );

  if (hidden) {
    const count = `${String(progress.done)}/${String(progress.total)}`;

    return (
      <Floating key="small">
        <Tappable
          accessibilityRole="button"
          accessibilityLabel={`Show workout, ${sets}`}
          onPress={() => {
            setHidden(false);
          }}
          style={[
            styles.small,
            box,
            {
              borderWidth: line,
              right: size.sidePadding,
              gap: space.sm,
              height: size.floatingBar.control,
              paddingHorizontal: space.md,
            },
          ]}
          hitSlop={barHitSlop}
        >
          {frosted}
          <WorkoutIcon color={colors.muted} size={16} />
          <Text style={[text.quickPick, { color: colors.text }]}>{count}</Text>
        </Tappable>
      </Floating>
    );
  }

  return (
    <Floating key="bar">
      <View
        style={[
          styles.bar,
          box,
          {
            borderWidth: line,
            left: size.sidePadding,
            right: size.sidePadding,
            gap: barGap,
            paddingLeft: space.sm,
            paddingRight: space.sm,
            paddingBottom: progressHeight,
          },
        ]}
      >
        {frosted}
        <Tappable
          accessibilityRole="button"
          accessibilityLabel="Hide workout bar"
          onPress={() => {
            setHidden(true);
          }}
          hitSlop={barHitSlop}
          style={[styles.hide, { height: size.floatingBar.control }]}
        >
          <ChevronDownIcon color={colors.muted} size={18} />
        </Tappable>
        <View style={styles.text}>
          <Text
            style={[text.quickPick, { color: colors.text }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text style={text.meta}>
            {elapsed === null ? sets : `${sets} · ${formatClock(elapsed)}`}
          </Text>
        </View>
        <Button
          compact
          label="Resume"
          onPress={() => {
            router.push(
              { pathname: '/workout/log/[id]', params: { id } },
              { withAnchor: true },
            );
          }}
        />
        <View style={styles.progress}>
          <ProgressBar done={progress.done} total={progress.total} />
        </View>
      </View>
    </Floating>
  );
}

const styles = StyleSheet.create({
  small: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    position: 'absolute',
    height: tokens.size.floatingBar.height,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  hide: {
    width: hideWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  progress: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
