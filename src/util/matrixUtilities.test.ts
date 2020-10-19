import { generateLocalPart } from './matrixUtilities';

test('templates {name} and {room} with parameter values', () => {
  expect(generateLocalPart('{name}_{room}', 'user', 'matrix')).toBe('user_matrix');
});

test('removes leading @-sign if present', () => {
  expect(generateLocalPart('@user', '', '')).toBe('user');
});
