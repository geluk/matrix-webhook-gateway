export default interface WebHook {
  id: number | undefined;
  path: string;
  room_id: string;
  user_id: string;
}
