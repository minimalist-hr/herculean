import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme/theme-provider';

import { Glow } from './glow';

interface Node {
  type: string;
  props: Record<string, unknown>;
  children: Node[] | null;
}

function findGradient(node: Node): number[] | undefined {
  if (Array.isArray(node.props.gradient)) {
    return node.props.gradient as number[];
  }
  for (const child of node.children ?? []) {
    const gradient =
      typeof child === 'object' ? findGradient(child) : undefined;
    if (gradient !== undefined) {
      return gradient;
    }
  }
  return undefined;
}

test('the glow starts at the glow opacity and fades out', async () => {
  await render(
    <ThemeProvider theme="dark">
      <Glow radiusX={0.7} radiusY={0.55} fadeAt={0.9} />
    </ThemeProvider>,
  );

  // The gradient is offset and color pairs, with the alpha in the color's top byte.
  const gradient = findGradient(screen.toJSON() as Node) ?? [];
  const alphas = gradient
    .filter((_, index) => index % 2 === 1)
    .map((color) => color >>> 24);
  expect(alphas[0]).toBe(Math.round(0.2 * 255));
  expect(alphas.at(-1)).toBe(0);
  // It only ever fades: each stop is as strong as the next or stronger.
  expect(alphas).toEqual([...alphas].sort((a, b) => b - a));
});
