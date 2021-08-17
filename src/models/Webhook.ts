export default interface Webhook {
  id: number;
  path: string;
  room_id: string;
  user_id: string;
}

export interface CreateWebhook {
  id?: number | undefined;
  path: string;
  room_id: string;
  user_id: string;
}
