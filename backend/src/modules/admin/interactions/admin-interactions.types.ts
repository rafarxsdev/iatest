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
  lastResetAt: Date | null;
  limitReachedAt: Date | null;
  lastInteractionAt: Date | null;
  createdAt: Date;
  isBlocked: boolean;
  remaining: number;
  usagePercent: number;
}

export interface InteractionLogEntry {
  actionTypeCode: string;
  interactionNumber: number;
  maxAtMoment: number;
  createdAt: Date;
  ipAddress: string | null;
}

export interface UserWithInteractionSummary {
  id: string;
  fullName: string;
  email: string;
  roleName: string;
  totalWidgets: number;
  totalInteractions: number;
  blockedWidgets: number;
  lastActivity: Date | null;
}
