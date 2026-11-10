import { useCallback, useRef, useState, type ReactNode } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * For a page whose heading scrolls away while its controls stay at the top:
 * tells when content passes under the controls, so they show a line.
 */
export function useStickyControls() {
  const headingHeight = useRef(0);
  const offset = useRef(0);
  const [lined, setLined] = useState(false);

  const onHeadingLayout = useCallback((event: LayoutChangeEvent) => {
    headingHeight.current = event.nativeEvent.layout.height;
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = event.nativeEvent.contentOffset.y;
      setLined(offset.current > headingHeight.current);
    },
    [],
  );

  /** Where new results start: the top, or just under the controls if the heading had scrolled away. */
  const resultsOffset = useCallback(
    () => (offset.current >= headingHeight.current ? headingHeight.current : 0),
    [],
  );

  return { lined, onHeadingLayout, onScroll, resultsOffset };
}

/** The search and chips that stay at the top, with a line once content scrolls under them. */
export function StickyControls({
  lined,
  children,
}: {
  lined: boolean;
  children: ReactNode;
}) {
  const { colors, space } = useTheme();

  return (
    <View
      testID="sticky-controls"
      style={{
        gap: space.sm,
        paddingBottom: space.md,
        backgroundColor: colors.bg,
        // Always 1 px, so the line comes and goes without moving anything.
        borderBottomWidth: 1,
        borderBottomColor: lined ? colors.border : colors.bg,
      }}
    >
      {children}
    </View>
  );
}
