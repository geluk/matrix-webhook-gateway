export default function parseBoolean(value: string | null | undefined): boolean | undefined {
  switch (value?.toLowerCase().trim()) {
    case 'true':
    case 'yes':
    case '1':
      return true;
    case 'false':
    case 'no':
    case '0':
      return false;
    default:
      return undefined;
  }
}
