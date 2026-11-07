import { usePathname, useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { setFloatingRoom, useAboveTabBar } from '@/components/above-tab-bar';
import { Button } from '@/components/button';
import { ChevronDownIcon, WorkoutIcon } from '@/components/icons';
import { ProgressBar } from '@/components/progress-bar';
import { Tappable } from '@/components/tappable';
import { formatClock } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { restBarRoom } from './rest-bar';
import { useElapsed } from './use-elapsed';
import { useResumeBarHidden } from './use-resume-bar-hidden';
import { useWorkout } from './use-workout';
import { useWorkoutInProgress } from './use-workout-in-progress';
import { progressText, workoutProgress } from './workout-progress';

const barHeight = 64;
const barGap = 4;
const hideWidth = 28;
const progressHeight = 4;

/** Takes you back to the workout in progress from any tab, floating above the tab bar and any action box on it. It stays hidden while it loads, if it fails, and while you log. */
export function ResumeBar() {
  const pathname = usePathname();
  const inProgress = useWorkoutInProgress().data;
  const shown = Boolean(inProgress) && !pathname.startsWith('/workout/log/');

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
  const { colors, radius, size, space, text } = useTheme();
  const router = useRouter();
  const { tabBar, actionBox } = useAboveTabBar();
  const workout = useWorkout(id).data;
  const elapsed = useElapsed(workout?.startedAtUtc);
  const { hidden, setHidden } = useResumeBarHidden(id);
  const ready = workout !== undefined && hidden !== undefined;

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
    bottom: tabBar + (actionBox?.height ?? 0) + space.sm,
    borderRadius: radius.card,
    borderColor: colors.border,
    backgroundColor: colors.raised,
  };

  if (hidden) {
    const count = `${String(progress.done)}/${String(progress.total)}`;

    return (
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
            right: size.sidePadding,
            gap: space.sm,
            height: size.touchTargetMin,
            paddingHorizontal: space.md,
          },
        ]}
      >
        <WorkoutIcon color={colors.muted} size={18} />
        <Text style={[text.listItemName, { color: colors.text }]}>{count}</Text>
      </Tappable>
    );
  }

  return (
    <View
      style={[
        styles.bar,
        box,
        {
          left: size.sidePadding,
          right: size.sidePadding,
          gap: barGap,
          paddingLeft: space.sm,
          paddingRight: space.sm,
          paddingBottom: progressHeight,
        },
      ]}
    >
      <Tappable
        accessibilityRole="button"
        accessibilityLabel="Hide workout bar"
        onPress={() => {
          setHidden(true);
        }}
        style={[styles.hide, { height: size.touchTargetMin }]}
      >
        <ChevronDownIcon color={colors.muted} size={20} />
      </Tappable>
      <View style={styles.text}>
        <Text
          style={[text.listItemName, { color: colors.text }]}
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
          router.push(`/workout/log/${id}` as Href);
        }}
      />
      <View style={styles.progress}>
        <ProgressBar done={progress.done} total={progress.total} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  small: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  bar: {
    position: 'absolute',
    height: barHeight,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
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
