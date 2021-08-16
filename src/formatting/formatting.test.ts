import {
  code, fmt, toFormat,
} from './formatting';

test('toFormat() on plaintext formats to itself', () => {
  const formatted = toFormat('A plaintext message');

  expect(formatted.formatHtml()).toBe('A plaintext message');
  expect(formatted.formatPlain()).toBe('A plaintext message');
});

test('fmt() on plaintext formats to itself', () => {
  const formatted = fmt('A plaintext message');

  expect(formatted.formatHtml()).toBe('A plaintext message');
  expect(formatted.formatPlain()).toBe('A plaintext message');
});

test('code formatting', () => {
  const formatted = code('a code block');

  expect(formatted.formatHtml()).toBe('<code>a code block</code>');
  expect(formatted.formatPlain()).toBe('a code block');
});
