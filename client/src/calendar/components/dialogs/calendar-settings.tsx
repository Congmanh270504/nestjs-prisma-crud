"use client";

import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChangeBadgeVariantInput } from "@/calendar/components/change-badge-variant-input";
import { ChangeVisibleHoursInput } from "@/calendar/components/change-visible-hours-input";
import { ChangeWorkingHoursInput } from "@/calendar/components/change-working-hours-input";

export function CalendarSettings() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit gap-2">
          <Settings className="size-4" />
          <span>Calendar settings</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Settings className="size-5" />
            <DialogTitle>Calendar settings</DialogTitle>
          </div>
          <DialogDescription>Configure badge variant, visible hours range, and your weekly working schedule.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] ">
          <div className="flex flex-col gap-6 py-2">
            <ChangeBadgeVariantInput />
            <div className="border-t pt-4">
              <ChangeVisibleHoursInput />
            </div>
            <div className="border-t pt-4">
              <ChangeWorkingHoursInput />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default CalendarSettings;
