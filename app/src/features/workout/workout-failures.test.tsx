import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { notifyFailure } from '@/components/notifications';
import { createTestQueryClient } from '@/test-utils/query-client';

import { useChangeLengthenedPartials } from './use-change-lengthened-partials';
import { useChangeSuperset } from './use-change-superset';
import { useDeleteSet } from './use-delete-set';
import { useSkipWorkout } from './use-skip-workout';
import { useUndoSkip } from './use-undo-skip';

const mockFetch = jest.fn<Promise<Response>, [Request]>();

jest.mock('@/api/client', () => {
  const createClient =
    jest.requireActual<typeof import('openapi-fetch')>('openapi-fetch').default;
  return {
    api: createClient({
      baseUrl: 'http://api.test',
      fetch: (request: Request) => mockFetch(request),
    }),
  };
});

jest.mock('@/components/notifications', () => ({
  ...jest.requireActual<typeof import('@/components/notifications')>(
    '@/components/notifications',
  ),
  notifyFailure: jest.fn(),
}));

const set = {
  id: 's1',
  order: 0,
  weightKg: 80,
  reps: 8,
  checked: false,
  partialsDone: false,
};

function hook<T>(use: () => T) {
  const client = createTestQueryClient();

  return renderHook(use, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(
    Response.json({ code: 'oops', status: 500 }, { status: 500 }),
  );
  jest.mocked(notifyFailure).mockClear();
});

/** A mutation hook, how to call it, and what its failure says. */
type FailureCase = [
  string,
  () => { mutate: (variables: never) => void },
  unknown,
  string,
];

const cases: FailureCase[] = [
  [
    'changing a superset',
    () => useChangeSuperset('w1'),
    { workoutExerciseId: 'we1', supersetWithNext: true },
    'Couldn’t change the superset. Try again.',
  ],
  [
    'changing lengthened partials',
    () => useChangeLengthenedPartials('w1'),
    { workoutExerciseId: 'we1', lengthenedPartials: true },
    'Couldn’t change lengthened partials. Try again.',
  ],
  [
    'skipping a workout',
    () => useSkipWorkout(),
    '2026-11-11',
    'Couldn’t skip the workout. Try again.',
  ],
  ['undoing a skip', () => useUndoSkip(), 'w1', 'Couldn’t undo. Try again.'],
  [
    'removing a set',
    () => useDeleteSet('w1'),
    { workoutExerciseId: 'we1', set },
    'Couldn’t remove the set. Try again.',
  ],
];

test.each(cases)(
  'a failure %s says so',
  async (_name, use, variables, message) => {
    const { result } = await hook(use);

    await act(async () => {
      (result.current.mutate as (value: unknown) => void)(variables);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(notifyFailure).toHaveBeenCalledWith(message);
    });
  },
);
