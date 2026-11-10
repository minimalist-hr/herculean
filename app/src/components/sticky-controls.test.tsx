import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ThemeProvider } from '@/theme/theme-provider';

import { StickyControls, useStickyControls } from './sticky-controls';

function Page() {
  const sticky = useStickyControls();
  const [offset, setOffset] = useState<number>();

  return (
    <ScrollView
      testID="page"
      stickyHeaderIndices={[1]}
      onScroll={sticky.onScroll}
    >
      <View testID="heading" onLayout={sticky.onHeadingLayout}>
        <Text>Heading</Text>
      </View>
      <StickyControls lined={sticky.lined}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Where results start"
          onPress={() => {
            setOffset(sticky.resultsOffset());
          }}
        >
          <Text>{`Offset ${String(offset)}`}</Text>
        </Pressable>
      </StickyControls>
    </ScrollView>
  );
}

async function scrollTo(y: number) {
  await fireEvent.scroll(screen.getByTestId('page'), {
    nativeEvent: {
      contentOffset: { x: 0, y },
      contentSize: { width: 390, height: 2000 },
      layoutMeasurement: { width: 390, height: 800 },
    },
  });
}

beforeEach(async () => {
  await render(
    <ThemeProvider theme="dark">
      <Page />
    </ThemeProvider>,
  );
  await fireEvent(screen.getByTestId('heading'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 120 } },
  });
});

test('a line shows only once content scrolls under the controls', async () => {
  const controls = screen.getByTestId('sticky-controls');
  expect(controls).toHaveStyle({ borderBottomColor: '#050506' });

  await scrollTo(200);
  expect(controls).toHaveStyle({
    borderBottomColor: '#2C2F34',
  });

  await scrollTo(40);
  expect(controls).toHaveStyle({ borderBottomColor: '#050506' });
});

test('new results start at the top, or under the controls once the heading has gone', async () => {
  const check = screen.getByRole('button', { name: 'Where results start' });
  await fireEvent.press(check);
  expect(screen.getByText('Offset 0')).toBeOnTheScreen();

  await scrollTo(300);
  await fireEvent.press(check);

  expect(screen.getByText('Offset 120')).toBeOnTheScreen();
});
