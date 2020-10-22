export function cleanForMatrix(id: string): string {
  return id.toLowerCase().split('').map((c) => c.replace(/[^a-z0-9]*/, '')).join('');
}

export function templateLocalPart(
  pattern: string,
  name: string,
  room: string,
): string {
  return pattern
    .replace('{name}', name)
    .replace('{room}', room);
}

export function generateLocalPart(
  pattern: string,
  name: string,
  room: string,
): string {
  return templateLocalPart(pattern, cleanForMatrix(name), cleanForMatrix(room))
    .replace('@', '');
}
