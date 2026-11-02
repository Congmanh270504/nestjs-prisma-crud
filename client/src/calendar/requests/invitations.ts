import { API_BASE_URL } from "./config";

export interface IGroupInvitation {
  id: string;
  code: string;
  groupId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  des?: string | null;
  userSentId?: string | null;
  userReceivedId?: string | null;
  userSent?: {
    id: string;
    clerkId?: string | null;
  } | null;
  userReceived?: {
    id: string;
    clerkId?: string | null;
  } | null;
  group?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
  createdAt: string;
}

export const createInvitationApi = async (invitationData: {
  code?: string;
  groupId?: string;
  userSentId?: string;
  userReceivedId?: string;
  des?: string;
}) => {
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

export const getInvitations = async (params?: {
  status?: string;
  clerkId?: string;
}): Promise<IGroupInvitation[]> => {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.clerkId) query.set("clerkId", params.clerkId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/invitations${qs}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const updateInvitationStatusApi = async (
  id: string,
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED"
): Promise<IGroupInvitation> => {
  const res = await fetch(`${API_BASE_URL}/invitations/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update invitation status");
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
