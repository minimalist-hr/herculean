import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { Skeleton } from './skeleton';

import { DragHandleIcon } from './icons';
import { joinedCardStyle } from './joined-cards';
import { useReduceMotion } from './use-reduce-motion';

interface Drag {
  from: number;
  to: number;
}

interface DraggableListProps<Item> {
  items: readonly Item[];
  keyOf: (item: Item) => string;
  /** What the handle is called, for example "Move Chest". */
  moveLabel: (item: Item) => string;
  onDragChange: (dragging: boolean) => void;
  onReorder: (items: Item[]) => void;
  /** Shows the rows without handles, for a part of the list that has no order of its own. */
  locked?: boolean;
  /** Joins two neighbouring rows into one block, except while dragging, which needs every row free. */
  joined?: (above: Item, below: Item) => boolean;
  /** What sits to the right of the handle. A row is one line high. */
  renderRow: (item: Item) => ReactNode;
}

function moved<Item>(items: readonly Item[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);

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

/** A list of cards, with a handle on each to drag it to another place. */
export function DraggableList<Item>({
  items: savedItems,
  keyOf,
  moveLabel,
  onDragChange,
  onReorder,
  locked = false,
  joined,
  renderRow,
}: DraggableListProps<Item>) {
  const { size, space } = useTheme();
  // A dropped row stays where it landed until the saved order catches up, so it never jumps back.
  const [dropped, setDropped] = useState<{
    from: readonly Item[];
    items: Item[];
  }>();
  const items = dropped?.from === savedItems ? dropped.items : savedItems;
  const step = size.optionRowMin + space.sm;
  const [pan] = useState(() => new Animated.Value(0));
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  // A gesture keeps the handlers it started with, so they read the latest values from here.
  const latest = useRef({ savedItems, items, onDragChange, onReorder });
  useEffect(() => {
    latest.current = { savedItems, items, onDragChange, onReorder };
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
      const last = latest.current.items.length - 1;
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
      const next = moved(latest.current.items, current.from, current.to);
      setDropped({ from: latest.current.savedItems, items: next });
      latest.current.onReorder(next);
    }
  }, []);

  return (
    <View style={{ gap: space.sm }}>
      {items.map((item, index) => (
        <DraggableRow
          key={keyOf(item)}
          moveLabel={moveLabel(item)}
          index={index}
          step={step}
          shift={shiftOf(index, drag)}
          dragging={drag !== null}
          lifted={drag?.from === index}
          locked={locked}
          withPrevious={
            drag === null &&
            index > 0 &&
            joined?.(items[index - 1], item) === true
          }
          withNext={
            drag === null &&
            index < items.length - 1 &&
            joined?.(item, items[index + 1]) === true
          }
          pan={pan}
          onStartDrag={startDrag}
          onMoveDrag={moveDrag}
          onEndDrag={endDrag}
          onMoveTo={(to) => {
            if (to >= 0 && to < items.length) {
              onReorder(moved(items, index, to));
            }
          }}
        >
          {renderRow(item)}
        </DraggableRow>
      ))}
    </View>
  );
}

interface DraggableRowProps {
  moveLabel: string;
  index: number;
  step: number;
  shift: number;
  dragging: boolean;
  lifted: boolean;
  locked: boolean;
  withPrevious: boolean;
  withNext: boolean;
  pan: Animated.Value;
  onStartDrag: (index: number) => void;
  onMoveDrag: (distance: number) => void;
  onEndDrag: () => void;
  onMoveTo: (index: number) => void;
  children: ReactNode;
}

function DraggableRow({
  moveLabel,
  index,
  step,
  shift,
  dragging,
  lifted,
  locked,
  withPrevious,
  withNext,
  pan,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
  onMoveTo,
  children,
}: DraggableRowProps) {
  const { colors, motion, radius, size, space } = useTheme();
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
          paddingLeft: locked ? space.lg : 4,
          paddingRight: 4,
          ...joinedCardStyle({
            withPrevious,
            withNext,
            gap: space.sm,
            radius: radius.card,
          }),
          borderColor: lifted ? colors.muted : colors.border,
          backgroundColor: colors.card,
          transform: [{ translateY: lifted ? pan : offset }],
        },
        lifted && styles.lifted,
      ]}
    >
      {!locked && (
        <View
          {...handle.panHandlers}
          accessible
          accessibilityRole="button"
          accessibilityLabel={moveLabel}
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
            styles.handle,
            { width: size.touchTargetMin, height: size.touchTargetMin },
          ]}
        >
          <DragHandleIcon color={colors.muted} size={20} />
        </View>
      )}
      {children}
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
  handle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** A list's rows while they load. */
export function DraggableListSkeleton({ rows }: { rows: number }) {
  const { size, space } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      {Array.from({ length: rows }, (_, row) => (
        <Skeleton key={row} width="100%" height={size.optionRowMin} />
      ))}
    </View>
  );
}
