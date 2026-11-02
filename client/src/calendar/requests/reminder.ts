import { API_BASE_URL } from "./config";

export interface IReminder {
  id: string;
  taskEventId: string;
  remindAt: string;
  channel?: "WEBHOOK" | "EMAIL" | "SMS";
  messageId?: string | null;
  status: "SCHEDULED" | "SENT" | "CANCELLED" | "FAILED";
  createdAt?: string;
  updatedAt?: string;
}

export const getRemindersApi = async (taskEventId?: string): Promise<IReminder[]> => {
  try {
    const qs = taskEventId ? `?taskEventId=${taskEventId}` : "";
    const res = await fetch(`${API_BASE_URL}/reminders${qs}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const deleteReminderApi = async (id: string): Promise<{ success: boolean }> => {
  const res = await fetch(`${API_BASE_URL}/reminders/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete reminder");
  }
  return res.json();
};
