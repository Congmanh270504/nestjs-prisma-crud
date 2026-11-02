import type { IUser } from "@/calendar/interfaces";
import { API_BASE_URL } from "./config";

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

export const getUsers = async (groupId?: string): Promise<IUser[]> => {
  try {
    const qs = groupId ? `?groupId=${groupId}` : "";
    const res = await fetch(`${API_BASE_URL}/users${qs}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }

    const clerkIds = data.map((u: any) => u.clerkId).filter((id): id is string => Boolean(id && id.startsWith("user_")));

    let clerkMap: Record<string, IClerkUser> = {};
    if (clerkIds.length > 0) {
      try {
        const clerkProfiles = await getClerkUsersApi(clerkIds);
        for (const p of clerkProfiles) {
          clerkMap[p.id] = p;
        }
      } catch {
        // Ignore clerk fetch failures
      }
    }

    return data.map((u: { id: string; clerkId?: string; name?: string; avatar?: string | null }) => {
      const clerk = u.clerkId ? clerkMap[u.clerkId] : null;
      return {
        id: u.id,
        clerkId: u.clerkId,
        name: clerk?.userName || u.name || (u.clerkId ? `User (${u.clerkId.slice(-4)})` : "User"),
        picturePath: clerk?.imageUrl || u.avatar || null,
      };
    });
  } catch {
    return [];
  }
};

export const getRecentUsers = async (limit = 20, excludeGroupId?: string): Promise<IClerkUser[]> => {
  try {
    const queryParams = new URLSearchParams({ limit: limit.toString() });
    if (excludeGroupId) {
      queryParams.set("excludeGroupId", excludeGroupId);
    }
    const res = await fetch(`${API_BASE_URL}/users?${queryParams.toString()}`, {
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
    const baseUrl = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/clerk-users`, {
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
