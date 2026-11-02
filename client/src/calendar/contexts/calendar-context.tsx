"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CALENDAR_ITEMS_MOCK, USERS_MOCK } from "@/calendar/mocks";
import { getEvents, getUsers, getGroupsApi, type IGroup } from "@/calendar/requests";
import { getPusherClient } from "@/lib/pusher";

import type { Dispatch, SetStateAction } from "react";
import type { IEvent, IUser } from "@/calendar/interfaces";
import type { TBadgeVariant, TVisibleHours, TWorkingHours } from "@/calendar/types";

interface ICalendarContext {
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  selectedUserId: IUser["id"] | "all";
  setSelectedUserId: (userId: IUser["id"] | "all") => void;
  selectedGroupId: string | null;
  groups: IGroup[];
  badgeVariant: TBadgeVariant;
  setBadgeVariant: (variant: TBadgeVariant) => void;
  users: IUser[];
  workingHours: TWorkingHours;
  setWorkingHours: Dispatch<SetStateAction<TWorkingHours>>;
  visibleHours: TVisibleHours;
  setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
  events: IEvent[];
  setLocalEvents: Dispatch<SetStateAction<IEvent[]>>;
  isMockMode: boolean;
}

export const WORKING_HOURS: TWorkingHours = {
  0: { from: 0, to: 0 },
  1: { from: 8, to: 17 },
  2: { from: 8, to: 17 },
  3: { from: 8, to: 17 },
  4: { from: 8, to: 17 },
  5: { from: 8, to: 17 },
  6: { from: 8, to: 12 },
};

export const VISIBLE_HOURS: TVisibleHours = { from: 7, to: 18 };

const CalendarContext = createContext<ICalendarContext>({
  selectedDate: new Date(),
  setSelectedDate: () => {},
  selectedUserId: "all",
  setSelectedUserId: () => {},
  selectedGroupId: null,
  groups: [],
  badgeVariant: "colored",
  setBadgeVariant: () => {},
  users: USERS_MOCK,
  workingHours: WORKING_HOURS,
  setWorkingHours: () => {},
  visibleHours: VISIBLE_HOURS,
  setVisibleHours: () => {},
  events: CALENDAR_ITEMS_MOCK,
  setLocalEvents: () => {},
  isMockMode: true,
});

export function CalendarProvider({ children, users: initialUsers, events: initialEvents }: { children: React.ReactNode; users: IUser[]; events: IEvent[] }) {
  const { isSignedIn, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const currentGroupId = searchParams.get("groupId") || undefined;

  const [badgeVariant, setBadgeVariant] = useState<TBadgeVariant>("colored");
  const [visibleHours, setVisibleHours] = useState<TVisibleHours>(VISIBLE_HOURS);
  const [workingHours, setWorkingHours] = useState<TWorkingHours>(WORKING_HOURS);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<IUser["id"] | "all">("all");

  const [groups, setGroups] = useState<IGroup[]>([]);
  const [backendUsers, setBackendUsers] = useState<IUser[]>(initialUsers);
  // Default to CALENDAR_ITEMS_MOCK so unauthenticated visitors see mock data right away
  const [localEvents, setLocalEvents] = useState<IEvent[]>(initialEvents?.length > 0 ? initialEvents : CALENDAR_ITEMS_MOCK);

  const { user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      // User is logged in: fetch events and users filtered by currentGroupId (if any)
      getEvents({ groupId: currentGroupId }).then(fetchedEvents => {
        setLocalEvents(fetchedEvents);
      });
      getUsers(currentGroupId).then(fetchedUsers => {
        setBackendUsers(fetchedUsers);
      });
      if (user?.id) {
        getGroupsApi({ clerkId: user.id }).then(fetchedGroups => {
          setGroups(fetchedGroups);
        });
      }
    } else {
      // User is not logged in: use mock data from mocks.ts
      setLocalEvents(CALENDAR_ITEMS_MOCK);
      setSelectedUserId("all");
      setGroups([]);
    }
  }, [isSignedIn, isLoaded, currentGroupId, user?.id]);

  // When backend users list updates, verify that selected user still belongs to it
  useEffect(() => {
    if (selectedUserId !== "all" && backendUsers.length > 0) {
      const exists = backendUsers.some(u => u.id === selectedUserId);
      if (!exists) {
        setSelectedUserId("all");
      }
    }
  }, [backendUsers, selectedUserId]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      if (isSignedIn) {
        getEvents({ groupId: currentGroupId }).then(setLocalEvents);
        getUsers(currentGroupId).then(setBackendUsers);
        if (user?.id) {
          getGroupsApi({ clerkId: user.id }).then(setGroups);
        }
      }
    };
    window.addEventListener("invitations-updated", handleRefresh);
    window.addEventListener("events-updated", handleRefresh);
    window.addEventListener("groups-updated", handleRefresh);
    return () => {
      window.removeEventListener("invitations-updated", handleRefresh);
      window.removeEventListener("events-updated", handleRefresh);
      window.removeEventListener("groups-updated", handleRefresh);
    };
  }, [isSignedIn, currentGroupId, user?.id]);

  // Keep ref of backendUsers for realtime user resolving without triggering resubscription
  const backendUsersRef = useRef(backendUsers);
  useEffect(() => {
    backendUsersRef.current = backendUsers;
  }, [backendUsers]);

  // Listen for Pusher realtime events on events-channel
  useEffect(() => {
    if (!isSignedIn) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("events-channel");

    const handleEventUpdated = (updatedEvent: IEvent) => {
      // If filtering by group, check whether the event belongs to this group
      if (!currentGroupId || updatedEvent.groupId === currentGroupId) {
        setLocalEvents(prev => {
          const index = prev.findIndex(e => String(e.id) === String(updatedEvent.id));
          const existingUser = index !== -1 ? prev[index].user : undefined;
          const groupMember = backendUsersRef.current.find(u => u.id === updatedEvent.user?.id);
          const resolvedUser = {
            ...existingUser,
            ...updatedEvent.user,
            name: groupMember?.name || existingUser?.name || updatedEvent.user?.name || "User",
            picturePath: groupMember?.picturePath ?? existingUser?.picturePath ?? updatedEvent.user?.picturePath ?? null,
          };
          const resolvedEvent: IEvent = {
            ...updatedEvent,
            user: resolvedUser,
          };

          if (index !== -1) {
            const next = [...prev];
            next[index] = resolvedEvent;
            return next;
          }
          return [...prev, resolvedEvent];
        });
      } else {
        // If event was moved out of current group, remove from view
        setLocalEvents(prev => prev.filter(e => String(e.id) !== String(updatedEvent.id)));
      }
    };

    const handleEventCreated = (newEvent: IEvent) => {
      if (!currentGroupId || newEvent.groupId === currentGroupId) {
        setLocalEvents(prev => {
          const exists = prev.some(e => String(e.id) === String(newEvent.id));
          const groupMember = backendUsersRef.current.find(u => u.id === newEvent.user?.id);
          const resolvedUser = {
            ...newEvent.user,
            name: groupMember?.name || newEvent.user?.name || "User",
            picturePath: groupMember?.picturePath ?? newEvent.user?.picturePath ?? null,
          };
          const resolvedEvent: IEvent = {
            ...newEvent,
            user: resolvedUser,
          };

          if (exists) {
            return prev.map(e => (String(e.id) === String(newEvent.id) ? resolvedEvent : e));
          }
          return [...prev, resolvedEvent];
        });
      }
    };

    const handleEventDeleted = (data: { id: string | number; groupId?: string }) => {
      setLocalEvents(prev => prev.filter(e => String(e.id) !== String(data.id)));
    };

    channel.bind("event-updated", handleEventUpdated);
    channel.bind("event-created", handleEventCreated);
    channel.bind("event-deleted", handleEventDeleted);

    return () => {
      channel.unbind("event-updated", handleEventUpdated);
      channel.unbind("event-created", handleEventCreated);
      channel.unbind("event-deleted", handleEventDeleted);
      pusher.unsubscribe("events-channel");
    };
  }, [isSignedIn, currentGroupId]);

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const isMockMode = !isLoaded || !isSignedIn;

  const activeUsers = useMemo(() => {
    if (isMockMode) {
      return USERS_MOCK;
    }
    return backendUsers;
  }, [isMockMode, backendUsers]);

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate: handleSelectDate,
        selectedUserId,
        setSelectedUserId,
        selectedGroupId: currentGroupId || null,
        groups,
        badgeVariant,
        setBadgeVariant,
        users: activeUsers,
        visibleHours,
        setVisibleHours,
        workingHours,
        setWorkingHours,
        events: localEvents,
        setLocalEvents,
        isMockMode,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
