export interface InteractionStatus {
  used: number;
  limit: number;
  remaining: number;
  isBlocked: boolean;
  lastInteractionAt?: string;
}
