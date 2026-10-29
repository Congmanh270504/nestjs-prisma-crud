"use client";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ChangeBadgeVariantInput() {
  const { badgeVariant, setBadgeVariant } = useCalendar();

  return (
    <div className="space-y-2">
      <Label htmlFor="change-badge-variant" className="text-sm font-semibold">
        Change badge variant
      </Label>

      <Select value={badgeVariant} onValueChange={setBadgeVariant}>
        <SelectTrigger className="ml-0.5 w-48" id="change-badge-variant">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="dot">Dot</SelectItem>
          <SelectItem value="colored">Colored</SelectItem>
          <SelectItem value="mixed">Mixed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
