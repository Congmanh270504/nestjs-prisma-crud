import { CALENDAR_ITEMS_MOCK, USERS_MOCK } from "@/calendar/mocks";
import type { IEvent, IUser } from "@/calendar/interfaces";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export const getEvents = async (): Promise<IEvent[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return CALENDAR_ITEMS_MOCK;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return CALENDAR_ITEMS_MOCK;
    }
    return data;
  } catch {
    return CALENDAR_ITEMS_MOCK;
  }
};

export const getUsers = async (): Promise<IUser[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return USERS_MOCK;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return USERS_MOCK;
    }
    return data.map((u: { id: string; name: string; avatar?: string | null }) => ({
      id: u.id,
      name: u.name,
      picturePath: u.avatar ?? null,
    }));
  } catch {
    return USERS_MOCK;
  }
};

export const createEventApi = async (eventData: {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  color: string;
  userId: string;
  projectId?: string;
}) => {
  const res = await fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
};

export const updateEventApi = async (id: string | number, eventData: Partial<IEvent>) => {
  const res = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: eventData.title,
      description: eventData.description,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      color: eventData.color,
      userId: eventData.user?.id,
    }),
  });
  if (!res.ok) throw new Error("Failed to update event");
  return res.json();
};

export const deleteEventApi = async (id: string | number) => {
  const res = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete event");
  return res.json();
};
