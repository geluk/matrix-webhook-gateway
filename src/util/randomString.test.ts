import randomString from './randomString';

test('generates a string of the specified length', () => {
  expect(randomString(32).length).toBe(32);
});

test('throws if length is invalid', () => {
  expect(() => randomString(-1).length).toThrow();
});
