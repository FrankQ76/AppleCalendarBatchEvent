
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startDate: Date;
  endDate: Date;
}

export interface BatchConfig {
  reason: string;
  startTime: string;
  endTime: string;
  alert: string;
  alert2: string;
  isAllDay: boolean;
}

export interface TimePreset {
  id: string;
  label: string; // This serves as both the preset name and the event title
  startTime: string;
  endTime: string;
  alert?: string;
  alert2?: string;
  isAllDay?: boolean;
}

export type DayState = 'selected' | 'disabled' | 'default';
