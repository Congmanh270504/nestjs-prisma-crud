"use client";

import { useRouter } from "next/navigation";
import { Columns, Grid3x3, List, Plus, Grid2x2, CalendarRange } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ToggleTabs } from "@/components/ui/toggle-tabs";

import { UserSelect } from "@/calendar/components/header/user-select";
import { TodayButton } from "@/calendar/components/header/today-button";
import { DateNavigator } from "@/calendar/components/header/date-navigator";
import { AddEventDialog } from "@/calendar/components/dialogs/add-event-dialog";

import type { IEvent } from "@/calendar/interfaces";
import type { TCalendarView } from "@/calendar/types";

interface IProps {
  view: TCalendarView;
  events: IEvent[];
}

const VIEW_TABS = [
  {
    value: "day",
    label: <List className="size-4" strokeWidth={1.8} />,
    title: "View by day",
    ariaLabel: "View by day",
  },
  {
    value: "week",
    label: <Columns className="size-4" strokeWidth={1.8} />,
    title: "View by week",
    ariaLabel: "View by week",
  },
  {
    value: "month",
    label: <Grid2x2 className="size-4" strokeWidth={1.8} />,
    title: "View by month",
    ariaLabel: "View by month",
  },
  {
    value: "year",
    label: <Grid3x3 className="size-4" strokeWidth={1.8} />,
    title: "View by year",
    ariaLabel: "View by year",
  },
  {
    value: "agenda",
    label: <CalendarRange className="size-4" strokeWidth={1.8} />,
    title: "View by agenda",
    ariaLabel: "View by agenda",
  },
];

export function CalendarHeader({ view, events }: IProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </div>

      <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
        <div className="flex w-full items-center gap-1.5">
          <ToggleTabs items={VIEW_TABS} value={view} onChange={val => router.push(`/${val}-view`)} className="h-9" />
          <UserSelect />
        </div>

        <AddEventDialog>
          <Button className="w-full sm:w-auto">
            <Plus />
            Add Event
          </Button>
        </AddEventDialog>
      </div>
    </div>
  );
}
