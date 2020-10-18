export default interface Webhook {
  id: number | undefined;
  path: string;
  room_id: string;
  user_id: string;
}
