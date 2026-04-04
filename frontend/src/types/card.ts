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
