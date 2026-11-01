import type { IEvent, IUser } from "@/calendar/interfaces";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export const getEvents = async (): Promise<IEvent[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
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

export const getUsers = async (): Promise<IUser[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map((u: { id: string; clerkId?: string; name?: string; avatar?: string | null }) => ({
      id: u.id,
      clerkId: u.clerkId,
      name: u.name || u.clerkId || "User",
      picturePath: u.avatar ?? null,
    }));
  } catch {
    return [];
  }
};

export interface IDbUser {
  id: string;
  clerkId?: string | null;
  role?: string;
  createdAt?: string;
}

export interface IClerkUser {
  id: string;
  userName: string | null;
  imageUrl?: string | null;
}

export const getRecentUsers = async (limit = 20): Promise<IClerkUser[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/users?limit=${limit}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }

    const userIds = data.map((u: IDbUser) => u.clerkId).filter((id): id is string => Boolean(id && id.startsWith("user_")));

    if (userIds.length === 0) {
      return [];
    }

    const clerkRes = await fetch("/api/clerk-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    });

    if (!clerkRes.ok) {
      return [];
    }

    return await clerkRes.json();
  } catch (error) {
    console.error("Error fetching recent users from DB:", error);
    return [];
  }
};

export const getClerkUsersApi = async (userIds: string[]): Promise<IClerkUser[]> => {
  if (!userIds || userIds.length === 0) return [];
  try {
    const res = await fetch("/api/clerk-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching Clerk users:", error);
    return [];
  }
};

export const createInvitationApi = async (invitationData: { code?: string; groupId?: string; userSentId?: string; userReceivedId?: string; des?: string }) => {
  const res = await fetch(`${API_BASE_URL}/invitations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invitationData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create invitation");
  }
  return res.json();
};

export const deleteInvitationApi = async (id: string): Promise<{ success: boolean }> => {
  const res = await fetch(`${API_BASE_URL}/invitations/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete invitation");
  }
  return res.json();
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

export const syncUserApi = async (clerkId: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkId }),
    });
    if (!res.ok) {
      console.warn("Failed to sync user to backend db:", res.statusText);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("Error syncing user to backend db:", err);
    return null;
  }
};

export interface IGroupInvitation {
  id: string;
  code: string;
  groupId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  des?: string | null;
  userSentId?: string | null;
  userReceivedId?: string | null;
  userReceived?: {
    id: string;
    clerkId?: string | null;
  } | null;
  createdAt: string;
}

export interface IGroup {
  id: string;
  name: string;
  color?: string | null;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  invitations?: IGroupInvitation[];
  _count?: {
    invitations: number;
  };
  isNew?: boolean;
}

export const getGroupsApi = async (params?: { clerkId?: string; ownerId?: string }): Promise<IGroup[]> => {
  try {
    const query = new URLSearchParams();
    if (params?.clerkId) query.set("clerkId", params.clerkId);
    if (params?.ownerId) query.set("ownerId", params.ownerId);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/groups${queryString}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching groups:", error);
    return [];
  }
};

export const createGroupApi = async (data: {
  name: string;
  color?: string;
  clerkId?: string;
  ownerId?: string;
}): Promise<IGroup> => {
  const res = await fetch(`${API_BASE_URL}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create group");
  }
  return res.json();
};

export const updateGroupApi = async (
  id: string,
  data: { name?: string; color?: string }
): Promise<IGroup> => {
  const res = await fetch(`${API_BASE_URL}/groups/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update group");
  }
  return res.json();
};

export const deleteGroupApi = async (id: string): Promise<{ success: boolean }> => {
  const res = await fetch(`${API_BASE_URL}/groups/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete group");
  }
  return res.json();
};

