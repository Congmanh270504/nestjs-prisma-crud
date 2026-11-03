import { useCalendar } from "@/calendar/contexts/calendar-context";
import { updateEventApi } from "@/calendar/requests";

import type { IEvent } from "@/calendar/interfaces";

export function useUpdateEvent() {
  const { setLocalEvents, isMockMode } = useCalendar();

  const updateEvent = async (event: IEvent) => {
    const newEvent: IEvent = { ...event };

    newEvent.startDate = new Date(event.startDate).toISOString();
    newEvent.endDate = new Date(event.endDate).toISOString();

    setLocalEvents(prev => {
      const index = prev.findIndex(e => String(e.id) === String(event.id));
      if (index === -1) return prev;
      return [...prev.slice(0, index), newEvent, ...prev.slice(index + 1)];
    });

    // Call backend API only when not in mock mode
    if (!isMockMode) {
      try {
        const res = await updateEventApi(newEvent.id, newEvent);
        console.log("✅ [updateEvent] API call successful:", res);
        window.dispatchEvent(new CustomEvent("events-updated"));
        return res;
      } catch (err) {
        console.error("❌ [updateEvent] API call failed:", err);
        throw err;
      }
    }
  };

  return { updateEvent };
}
