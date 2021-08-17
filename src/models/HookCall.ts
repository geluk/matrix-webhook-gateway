export default interface HookCall {
  id?: number | undefined;
  hook_id: number;
  timestamp: Date;
  content: string;
}
