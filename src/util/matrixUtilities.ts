export function cleanForMatrix(id: string): string {
  return id.toLowerCase().split('').map((c) => c.replace(/[^a-z0-9]*/, '')).join('');
}

export function generateLocalPart(
  pattern: string,
  name: string,
  room: string,
): string {
  return pattern
    .replace('{name}', cleanForMatrix(name))
    .replace('{room}', cleanForMatrix(room.split(':')[0]))
    .replace('@', '');
}
