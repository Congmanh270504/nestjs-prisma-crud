import type { TEventColor } from "@/calendar/types";

export interface IUser {
  id: string;
  clerkId?: string;
  name: string;
  picturePath?: string | null;
}

export interface IEvent {
  id: string | number;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
  creatorId?: string;
  creator?: IUser;
  assigneeId?: string | null;
  assignee?: IUser | null;
  status?: string;
  priority?: string;
  groupId?: string;
  group?: { id: string; name: string; color?: string | null } | null;
  project?: { id: string; name: string; color: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
