"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { CALENDAR_ITEMS_MOCK, USERS_MOCK } from "@/calendar/mocks";
import { getEvents, getUsers } from "@/calendar/requests";

import type { Dispatch, SetStateAction } from "react";
import type { IEvent, IUser } from "@/calendar/interfaces";
import type { TBadgeVariant, TVisibleHours, TWorkingHours } from "@/calendar/types";

interface ICalendarContext {
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  selectedUserId: IUser["id"] | "all";
  setSelectedUserId: (userId: IUser["id"] | "all") => void;
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

export function CalendarProvider({
  children,
  users: initialUsers,
  events: initialEvents,
}: {
  children: React.ReactNode;
  users: IUser[];
  events: IEvent[];
}) {
  const { isSignedIn, isLoaded } = useUser();

  const [badgeVariant, setBadgeVariant] = useState<TBadgeVariant>("colored");
  const [visibleHours, setVisibleHours] = useState<TVisibleHours>(VISIBLE_HOURS);
  const [workingHours, setWorkingHours] = useState<TWorkingHours>(WORKING_HOURS);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<IUser["id"] | "all">("all");

  const [backendUsers, setBackendUsers] = useState<IUser[]>(initialUsers);
  // Default to CALENDAR_ITEMS_MOCK so unauthenticated visitors see mock data right away
  const [localEvents, setLocalEvents] = useState<IEvent[]>(CALENDAR_ITEMS_MOCK);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      // User is logged in: use real backend data
      if (initialEvents && initialEvents.length > 0) {
        setLocalEvents(initialEvents);
      }
      getEvents().then((fetchedEvents) => {
        setLocalEvents(fetchedEvents);
      });
      getUsers().then((fetchedUsers) => {
        setBackendUsers(fetchedUsers);
      });
    } else {
      // User is not logged in: use mock data from mocks.ts
      setLocalEvents(CALENDAR_ITEMS_MOCK);
      setSelectedUserId("all");
    }
  }, [isSignedIn, isLoaded, initialEvents]);

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const isMockMode = !isLoaded || !isSignedIn;

  const activeUsers = useMemo(() => {
    if (isMockMode) {
      return USERS_MOCK;
    }
    return backendUsers && backendUsers.length > 0 ? backendUsers : initialUsers;
  }, [isMockMode, backendUsers, initialUsers]);

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate: handleSelectDate,
        selectedUserId,
        setSelectedUserId,
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
