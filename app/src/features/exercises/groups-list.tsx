import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { components } from '@/api/schema';
import { ChevronRightIcon, DragHandleIcon } from '@/components/icons';
import { useReduceMotion } from '@/components/use-reduce-motion';
import { useTheme } from '@/theme/theme-provider';

import { countOf } from './group-name-sheet';

type Group = components['schemas']['GroupListItemResponse'];

interface Drag {
  from: number;
  to: number;
}

interface GroupsListProps {
  groups: readonly Group[];
  onDragChange: (dragging: boolean) => void;
  onReorder: (groups: Group[]) => void;
  onOpen: (group: Group) => void;
}

function moved(groups: readonly Group[], from: number, to: number) {
  const next = [...groups];
  const [group] = next.splice(from, 1);
  next.splice(to, 0, group);

  return next;
}

/** How many places a row moves aside for the one being dragged. */
function shiftOf(index: number, drag: Drag | null) {
  if (drag === null || index === drag.from) {
    return 0;
  }
  if (index > drag.from && index <= drag.to) {
    return -1;
  }

  return index < drag.from && index >= drag.to ? 1 : 0;
}

/** The groups, with a handle on each to drag it to another place. */
export function GroupsList({
  groups: savedGroups,
  onDragChange,
  onReorder,
  onOpen,
}: GroupsListProps) {
  const { size, space } = useTheme();
  // A dropped row stays where it landed until the saved order catches up, so it never jumps back.
  const [dropped, setDropped] = useState<{
    from: readonly Group[];
    groups: Group[];
  }>();
  const groups = dropped?.from === savedGroups ? dropped.groups : savedGroups;
  const step = size.optionRowMin + space.sm;
  const [pan] = useState(() => new Animated.Value(0));
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  // A gesture keeps the handlers it started with, so they read the latest values from here.
  const latest = useRef({ savedGroups, groups, onDragChange, onReorder });
  useEffect(() => {
    latest.current = { savedGroups, groups, onDragChange, onReorder };
  });

  const startDrag = useCallback(
    (index: number) => {
      const start = { from: index, to: index };
      dragRef.current = start;
      pan.setValue(0);
      setDrag(start);
      latest.current.onDragChange(true);
    },
    [pan],
  );

  const moveDrag = useCallback(
    (distance: number) => {
      const current = dragRef.current;
      if (current === null) {
        return;
      }

      pan.setValue(distance);
      const last = latest.current.groups.length - 1;
      const to = Math.max(
        0,
        Math.min(last, current.from + Math.round(distance / step)),
      );
      if (to !== current.to) {
        const next = { ...current, to };
        dragRef.current = next;
        setDrag(next);
      }
    },
    [pan, step],
  );

  const endDrag = useCallback(() => {
    const current = dragRef.current;
    if (current === null) {
      return;
    }

    dragRef.current = null;
    setDrag(null);
    latest.current.onDragChange(false);
    if (current.to !== current.from) {
      const next = moved(latest.current.groups, current.from, current.to);
      setDropped({ from: latest.current.savedGroups, groups: next });
      latest.current.onReorder(next);
    }
  }, []);

  return (
    <View style={{ gap: space.sm }}>
      {groups.map((group, index) => (
        <GroupRow
          key={group.id}
          group={group}
          index={index}
          step={step}
          shift={shiftOf(index, drag)}
          dragging={drag !== null}
          lifted={drag?.from === index}
          pan={pan}
          onStartDrag={startDrag}
          onMoveDrag={moveDrag}
          onEndDrag={endDrag}
          onMoveTo={(to) => {
            if (to >= 0 && to < groups.length) {
              onReorder(moved(groups, index, to));
            }
          }}
          onOpen={onOpen}
        />
      ))}
    </View>
  );
}

interface GroupRowProps {
  group: Group;
  index: number;
  step: number;
  shift: number;
  dragging: boolean;
  lifted: boolean;
  pan: Animated.Value;
  onStartDrag: (index: number) => void;
  onMoveDrag: (distance: number) => void;
  onEndDrag: () => void;
  onMoveTo: (index: number) => void;
  onOpen: (group: Group) => void;
}

function GroupRow({
  group,
  index,
  step,
  shift,
  dragging,
  lifted,
  pan,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
  onMoveTo,
  onOpen,
}: GroupRowProps) {
  const { colors, motion, radius, size, space, text } = useTheme();
  const reduceMotion = useReduceMotion();
  const [offset] = useState(() => new Animated.Value(0));

  // Once a drag ends the rows are in their new places, so they stop being moved aside at once.
  useLayoutEffect(() => {
    if (!dragging) {
      offset.setValue(0);
      return;
    }

    Animated.timing(offset, {
      toValue: shift * step,
      duration: reduceMotion ? 0 : motion.sheetMs,
      useNativeDriver: false,
    }).start();
  }, [dragging, motion.sheetMs, offset, reduceMotion, shift, step]);

  const handle = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          onStartDrag(index);
        },
        onPanResponderMove: (_event, gesture) => {
          onMoveDrag(gesture.dy);
        },
        onPanResponderRelease: onEndDrag,
        onPanResponderTerminate: onEndDrag,
      }),
    [index, onEndDrag, onMoveDrag, onStartDrag],
  );

  return (
    <Animated.View
      style={[
        styles.row,
        {
          gap: 2,
          height: size.optionRowMin,
          paddingHorizontal: 4,
          borderRadius: radius.card,
          borderColor: lifted ? colors.muted : colors.border,
          backgroundColor: colors.card,
          transform: [{ translateY: lifted ? pan : offset }],
        },
        lifted && styles.lifted,
      ]}
    >
      <View
        {...handle.panHandlers}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Move ${group.name}`}
        accessibilityActions={[
          { name: 'moveUp', label: 'Move up' },
          { name: 'moveDown', label: 'Move down' },
        ]}
        onAccessibilityAction={(event) => {
          onMoveTo(
            event.nativeEvent.actionName === 'moveUp' ? index - 1 : index + 1,
          );
        }}
        style={[
          styles.icon,
          { width: size.touchTargetMin, height: size.touchTargetMin },
        ]}
      >
        <DragHandleIcon color={colors.muted} size={20} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${group.name}, ${countOf(group)}`}
        onPress={() => {
          onOpen(group);
        }}
        style={[styles.name, { gap: space.md, paddingRight: space.md }]}
      >
        <View style={styles.nameText}>
          <Text
            numberOfLines={1}
            style={[text.listItemName, { color: colors.text }]}
          >
            {group.name}
          </Text>
          <Text style={text.meta}>{countOf(group)}</Text>
        </View>
        <ChevronRightIcon color={colors.muted} size={16} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  lifted: {
    zIndex: 1,
    elevation: 4,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  nameText: {
    flex: 1,
    gap: 2,
  },
});
