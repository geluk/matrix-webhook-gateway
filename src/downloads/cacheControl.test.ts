import parseCacheControl from './cacheControl';

function verifyInFuture(date: Date, seconds: number) {
  // We'll use a tolerance of 5 seconds by default.
  // This is fine-grained enough for what we're trying to achieve.
  const tolerance = 5000;

  const msInFuture = date.valueOf() - Date.now();
  const difference = Math.abs(seconds * 1000 - msInFuture);
  expect(difference).toBeLessThan(tolerance);
}

test('no cache control header -> 1800s', () => {
  verifyInFuture(parseCacheControl(null), 1800);
});

test('no-cache -> 0s', () => {
  verifyInFuture(parseCacheControl('no-cache'), 0);
});

test('no-store -> 0s', () => {
  verifyInFuture(parseCacheControl('no-store'), 0);
});

test('public, max-age=3600 -> 3600s', () => {
  verifyInFuture(parseCacheControl('public, max-age=3600'), 3600);
});

test('invalid header -> 1800s', () => {
  verifyInFuture(parseCacheControl('not a valid header'), 1800);
});
