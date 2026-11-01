import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userIds: string[] = Array.isArray(body?.userIds) ? body.userIds : [];

    if (!userIds || userIds.length === 0) {
      return NextResponse.json([]);
    }

    // Filter to only valid clerk user ID patterns
    const validClerkIds = userIds.filter((id) => typeof id === "string" && id.startsWith("user_"));

    if (validClerkIds.length === 0) {
      return NextResponse.json([]);
    }

    const client = await clerkClient();
    const res = await client.users.getUserList({
      userId: validClerkIds,
      limit: validClerkIds.length,
    });

    const userList = (res as any)?.data ?? res;

    const mapped = (Array.isArray(userList) ? userList : []).map((u: any) => {
      const userName =
        u.username ||
        [u.firstName, u.lastName].filter(Boolean).join(" ") ||
        u.firstName ||
        u.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
        "User";

      return {
        id: u.id,
        userName,
        imageUrl: u.imageUrl || null,
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error("[api/clerk-users] Error fetching Clerk users:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch Clerk users" }, { status: 500 });
  }
}
