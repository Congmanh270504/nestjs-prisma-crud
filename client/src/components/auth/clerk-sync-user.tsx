"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { syncUserApi } from "@/calendar/requests";

export function ClerkSyncUser() {
  const { isLoaded, isSignedIn, user } = useUser();
  const syncedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id && syncedIdRef.current !== user.id) {
      syncedIdRef.current = user.id;
      syncUserApi(user.id).then((result) => {
        if (result) {
          console.log("✅ [ClerkSyncUser] Successfully synced clerkId to DB:", user.id);
        }
      });
    }
  }, [isLoaded, isSignedIn, user?.id]);

  return null;
}
