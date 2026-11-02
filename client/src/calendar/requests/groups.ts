import { API_BASE_URL } from "./config";
import type { IGroupInvitation } from "./invitations";

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
