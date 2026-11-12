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

/** Which blocks move: from one block's place to another's. */
/** The width a block's mark takes at its right edge. */
const markWidth = 26;

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
  /** Joins two neighbouring rows into one block, which moves as one. While dragging the rows separate. */
  joined?: (above: Item, below: Item) => boolean;
  /** Marks a joined block up its right edge, for example a superset's stripe. */
  blockMark?: ReactNode;
  /** What sits to the right of the handle. A row is one line high. */
  renderRow: (item: Item) => ReactNode;
}

/** The rows as blocks: a row with the ones joined to it. */
function blocksOf<Item>(
  items: readonly Item[],
  joined: ((above: Item, below: Item) => boolean) | undefined,
) {
  const blocks: Item[][] = [];
  for (const [index, item] of items.entries()) {
    const block = blocks.at(-1);
    if (block !== undefined && joined?.(items[index - 1], item) === true) {
      block.push(item);
    } else {
      blocks.push([item]);
    }
  }

  return blocks;
}

function moved<Item>(blocks: readonly Item[][], from: number, to: number) {
  const next = [...blocks];
  const [block] = next.splice(from, 1);
  next.splice(to, 0, block);

  return next.flat();
}

/** Where a dragged block lands: past each block whose middle it has crossed, distance counted in rows. */
function landingOf(sizes: number[], from: number, rows: number) {
  let to = from;
  let crossed = 0;
  const way = rows > 0 ? 1 : -1;
  for (
    let index = from + way;
    index >= 0 && index < sizes.length;
    index += way
  ) {
    if (Math.abs(rows) < crossed + sizes[index] / 2) {
      break;
    }
    crossed += sizes[index];
    to = index;
  }

  return to;
}

/** How many rows a block moves aside for the one being dragged. */
function shiftOf(block: number, drag: Drag | null, draggedRows: number) {
  if (drag === null || block === drag.from) {
    return 0;
  }
  if (block > drag.from && block <= drag.to) {
    return -draggedRows;
  }

  return block < drag.from && block >= drag.to ? draggedRows : 0;
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
  blockMark,
  renderRow,
}: DraggableListProps<Item>) {
  const { size, space } = useTheme();
  // A dropped row stays where it landed until the saved order catches up, so it never jumps back.
  const [dropped, setDropped] = useState<{
    from: readonly Item[];
    items: Item[];
  }>();
  const items = dropped?.from === savedItems ? dropped.items : savedItems;
  const blocks = useMemo(() => blocksOf(items, joined), [items, joined]);
  const step = size.optionRowMin + space.sm;
  const [pan] = useState(() => new Animated.Value(0));
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  // A gesture keeps the handlers it started with, so they read the latest values from here.
  const latest = useRef({ savedItems, blocks, onDragChange, onReorder });
  useEffect(() => {
    latest.current = { savedItems, blocks, onDragChange, onReorder };
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
      const to = landingOf(
        latest.current.blocks.map((block) => block.length),
        current.from,
        distance / step,
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
      const next = moved(latest.current.blocks, current.from, current.to);
      setDropped({ from: latest.current.savedItems, items: next });
      latest.current.onReorder(next);
    }
  }, []);

  const draggedRows = drag === null ? 0 : blocks[drag.from].length;

  return (
    <View style={{ gap: space.sm }}>
      {blocks.flatMap((block, blockIndex) =>
        block.map((item, row) => (
          <DraggableRow
            key={keyOf(item)}
            moveLabel={moveLabel(item)}
            index={blockIndex}
            step={step}
            shift={shiftOf(blockIndex, drag, draggedRows)}
            dragging={drag !== null}
            lifted={drag?.from === blockIndex}
            locked={locked}
            withPrevious={drag === null && row > 0}
            withNext={drag === null && row < block.length - 1}
            markRows={
              blockMark !== undefined && block.length > 1
                ? { rows: block.length, last: row === block.length - 1 }
                : undefined
            }
            mark={blockMark}
            pan={pan}
            onStartDrag={startDrag}
            onMoveDrag={moveDrag}
            onEndDrag={endDrag}
            onMoveTo={(to) => {
              if (to >= 0 && to < blocks.length) {
                onReorder(moved(blocks, blockIndex, to));
              }
            }}
          >
            {renderRow(item)}
          </DraggableRow>
        )),
      )}
    </View>
  );
}

interface DraggableRowProps {
  moveLabel: string;
  /** Its block's place. A block's rows move together. */
  index: number;
  step: number;
  shift: number;
  dragging: boolean;
  lifted: boolean;
  locked: boolean;
  withPrevious: boolean;
  withNext: boolean;
  /** In a marked block: how many rows it has, and whether this is the last, which draws the mark over them all. */
  markRows?: { rows: number; last: boolean };
  mark?: ReactNode;
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
  markRows,
  mark,
  pan,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
  onMoveTo,
  children,
}: DraggableRowProps) {
  const { colors, line, motion, radius, size, space } = useTheme();
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
      duration: reduceMotion ? 0 : motion.standardMs,
      useNativeDriver: false,
    }).start();
  }, [dragging, motion.standardMs, offset, reduceMotion, shift, step]);

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
          borderWidth: line,
          gap: space.xxxs,
          height: size.optionRowMin,
          paddingLeft: locked ? space.lg : 4,
          // A marked block keeps room for its mark, even while the rows are apart.
          paddingRight: space.xxs + (markRows === undefined ? 0 : markWidth),
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
      {markRows?.last === true && !dragging && (
        <View
          pointerEvents="none"
          style={[
            styles.mark,
            {
              // Joined rows share a line, so a block is one pixel shorter per join, less its own border.
              height:
                markRows.rows * size.optionRowMin - (markRows.rows - 1) - 2,
              borderTopRightRadius: radius.card - 1,
              borderBottomRightRadius: radius.card - 1,
            },
          ]}
        >
          {mark}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lifted: {
    zIndex: 1,
    elevation: 4,
  },
  mark: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: markWidth,
    overflow: 'hidden',
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
