import { ApiProblemError } from './problem';
import { retryOnce } from './query-client';

function problem(status: number) {
  return new ApiProblemError({
    type: 'about:blank',
    title: 'Error',
    status,
    detail: 'It failed.',
    code: 'error',
    traceId: '00-1',
  });
}

test('a quick failure gets one more try', () => {
  expect(retryOnce(0, new TypeError('Network request failed'))).toBe(true);
});

test('a server error gets one more try', () => {
  expect(retryOnce(0, problem(503))).toBe(true);
});

test('one more try is all it gets', () => {
  expect(retryOnce(1, new TypeError('Network request failed'))).toBe(false);
});

test.each([400, 401, 404, 409])(
  'a refused request (%i) is not tried again',
  (status) => {
    expect(retryOnce(0, problem(status))).toBe(false);
  },
);

test('a request that already waited out its time is not tried again', () => {
  const timedOut = Object.assign(new Error('Aborted'), { name: 'AbortError' });

  expect(retryOnce(0, timedOut)).toBe(false);
});
