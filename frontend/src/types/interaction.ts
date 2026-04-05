export interface InteractionStatus {
  used: number;
  limit: number;
  remaining: number;
  isBlocked: boolean;
  lastInteractionAt?: string;
}

export interface UserInteractionDetail {
  id: string;
  cardId: string;
  cardTitle: string;
  cardIsActive: boolean;
  widgetCode: string;
  widgetLabel: string;
  filterLabel: string;
  interactionCount: number;
  limitAtCreation: number;
  resetPolicyCode: string;
  lastResetAt: string | null;
  limitReachedAt: string | null;
  lastInteractionAt: string | null;
  createdAt: string;
  isBlocked: boolean;
  remaining: number;
  usagePercent: number;
}

export interface UserWithInteractionSummary {
  id: string;
  fullName: string;
  email: string;
  roleName: string;
  totalWidgets: number;
  totalInteractions: number;
  blockedWidgets: number;
  lastActivity: string | null;
}

export interface InteractionLogEntry {
  actionTypeCode: string;
  interactionNumber: number;
  maxAtMoment: number;
  createdAt: string;
  ipAddress: string | null;
}
