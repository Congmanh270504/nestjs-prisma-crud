import type { TEventColor } from "@/calendar/types";

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

export interface IReminder {
  id: string;
  remindAt: string;
  status: string;
  channel: string;
}

export interface IEvent {
  id: string | number;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
  status?: string;
  priority?: string;
  project?: { id: string; name: string; color: string } | null;
  reminders?: IReminder[];
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
