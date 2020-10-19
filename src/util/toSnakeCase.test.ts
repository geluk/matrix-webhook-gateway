import toSnakeCase from './toSnakeCase';

test('converts camelCase to snake_case', () => {
  expect(toSnakeCase('snakeCase')).toBe('snake_case');
});
