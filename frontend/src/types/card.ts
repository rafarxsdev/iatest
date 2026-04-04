import type { InteractionStatus } from './interaction';

export interface WidgetType {
  code: string;
  label: string;
}

export interface Card {
  id: string;
  title: string;
  htmlContent: string;
  widgetType: WidgetType;
  interactionStatus: InteractionStatus;
  sortOrder: number;
}

export interface AdminCard {
  id: string;
  title: string;
  htmlContent: string;
  filter: { id: string; label: string };
  widgetType: { id: string; code: string; label: string };
  isActive: boolean;
  isDeleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardFormData {
  title: string;
  htmlContent: string;
  filterId: string;
  widgetTypeId: string;
  widgetConfiguration: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}
