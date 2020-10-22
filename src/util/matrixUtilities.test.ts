import { generateLocalPart, templateLocalPart } from './matrixUtilities';

describe('generateLocalPart', () => {
  test('templates {name} and {room} with parameter values', () => {
    expect(generateLocalPart('{name}_{room}', 'user', 'matrix')).toBe('user_matrix');
  });

  test('removes leading @-sign if present', () => {
    expect(generateLocalPart('@user', '', '')).toBe('user');
  });

  test('removes special characters in username if present', () => {
    expect(generateLocalPart('{name}_test', '!!alpha!!', '')).toBe('alpha_test');
  });

  test('removes special characters in room name if present', () => {
    expect(generateLocalPart('{room}_test', '', '^&$valid#@&&')).toBe('valid_test');
  });
});

describe('generateLocalPart', () => {
  test('templates {name} and {room} with parameter values', () => {
    expect(templateLocalPart('{name}_{room}', 'user', 'matrix')).toBe('user_matrix');
  });
  test('leaves special characters intact', () => {
    expect(templateLocalPart('@{name}_{room}', '!', '***')).toBe('@!_***');
  });
});
