import {
  code, fmt, ifNotEmpty, renderEmoji, toFormat,
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

test('emoji rendering', () => {
  const formatted = renderEmoji('fire :fire: coffee:coffee:snake:snake:');
  expect(formatted.formatPlain()).toBe('fire 🔥 coffee☕snake🐍')
})

describe('ifNotEmpty', () => {
  test('renders if text is not empty', () => {
    const formatted = ifNotEmpty('abc', 'def');
    expect(formatted.formatPlain()).toBe('def')
  });

  test('does not render if text is empty', () => {
    const formatted = ifNotEmpty('', 'def');
    expect(formatted.formatPlain()).toBe('')
  });

  test('does not render if text is null', () => {
    const formatted = ifNotEmpty(null, 'def');
    expect(formatted.formatPlain()).toBe('')
  });

  test('does not render if text is undefined', () => {
    const formatted = ifNotEmpty(undefined, 'def');
    expect(formatted.formatPlain()).toBe('')
  });
});

