import type { IEvent } from "@/calendar/interfaces";
import { API_BASE_URL } from "./config";

export const getEvents = async (params?: { groupId?: string; userId?: string }): Promise<IEvent[]> => {
  try {
    const query = new URLSearchParams();
    if (params?.groupId) query.set("groupId", params.groupId);
    if (params?.userId) query.set("userId", params.userId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/events${qs}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  } catch {
    return [];
  }
};

export const createEventApi = async (eventData: {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  color: string;
  userId: string;
  groupId?: string;
  status?: string;
  priority?: string;
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
  const payload: Record<string, any> = {};
  if (eventData.title !== undefined) payload.title = eventData.title;
  if (eventData.description !== undefined) payload.description = eventData.description;
  if (eventData.startDate !== undefined) payload.startDate = eventData.startDate;
  if (eventData.endDate !== undefined) payload.endDate = eventData.endDate;
  if (eventData.color !== undefined) payload.color = eventData.color;
  if (eventData.user?.id) payload.userId = eventData.user.id;
  if (eventData.groupId !== undefined) payload.groupId = eventData.groupId;
  if (eventData.status !== undefined) payload.status = eventData.status;
  if (eventData.priority !== undefined) payload.priority = eventData.priority;

  const res = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
