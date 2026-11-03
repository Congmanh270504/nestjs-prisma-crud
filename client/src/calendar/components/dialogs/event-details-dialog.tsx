"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceStrict, isValid, parseISO } from "date-fns";
import {
  AlertTriangle,
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  CircleDot,
  Clock,
  Loader2,
  Minus,
  User,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditEventDialog } from "@/calendar/components/dialogs/edit-event-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { useUpdateEvent } from "@/calendar/hooks/use-update-event";
import { cn } from "@/lib/utils";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

const COLOR_MAP: Record<string, { dot: string; text: string; bg: string }> = {
  blue: { dot: "bg-blue-500", text: "text-blue-500", bg: "bg-blue-500/10" },
  green: { dot: "bg-emerald-500", text: "text-emerald-500", bg: "bg-emerald-500/10" },
  red: { dot: "bg-rose-500", text: "text-rose-500", bg: "bg-rose-500/10" },
  yellow: { dot: "bg-amber-500", text: "text-amber-500", bg: "bg-amber-500/10" },
  purple: { dot: "bg-purple-500", text: "text-purple-500", bg: "bg-purple-500/10" },
  orange: { dot: "bg-orange-500", text: "text-orange-500", bg: "bg-orange-500/10" },
  gray: { dot: "bg-slate-400", text: "text-slate-400", bg: "bg-slate-400/10" },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  TODO: {
    label: "To Do",
    className: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    icon: CircleDot,
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Clock,
  },
  DONE: {
    label: "Done",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: XCircle,
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  LOW: {
    label: "Low Priority",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: ArrowDown,
  },
  MEDIUM: {
    label: "Medium Priority",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Minus,
  },
  HIGH: {
    label: "High Priority",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    icon: ArrowUp,
  },
  URGENT: {
    label: "Urgent",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-semibold",
    icon: AlertTriangle,
  },
};

export function EventDetailsDialog({ event, children }: IProps) {
  const { users = [], groups = [] } = useCalendar();
  const { updateEvent } = useUpdateEvent();

  const [currentStatus, setCurrentStatus] = useState(event.status || "TODO");
  const [currentPriority, setCurrentPriority] = useState(event.priority || "MEDIUM");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);

  useEffect(() => {
    if (event.status) setCurrentStatus(event.status);
  }, [event.status]);

  useEffect(() => {
    if (event.priority) setCurrentPriority(event.priority);
  }, [event.priority]);

  const handleStatusChange = async (newStatus: string) => {
    setCurrentStatus(newStatus);
    setIsUpdatingStatus(true);
    try {
      await updateEvent({ ...event, status: newStatus, priority: currentPriority });
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    setCurrentPriority(newPriority);
    setIsUpdatingPriority(true);
    try {
      await updateEvent({ ...event, priority: newPriority, status: currentStatus });
    } catch (err) {
      console.error("Failed to update priority:", err);
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  const safeFormatDate = (dateStr?: string, fmt = "MMM d, yyyy h:mm a") => {
    if (!dateStr) return null;
    try {
      const d = parseISO(dateStr);
      return isValid(d) ? format(d, fmt) : null;
    } catch {
      return null;
    }
  };

  let durationStr = "";
  try {
    if (isValid(startDate) && isValid(endDate)) {
      durationStr = formatDistanceStrict(endDate, startDate);
    }
  } catch {
    // ignore
  }

  // Resolve creator
  const creatorUser =
    users.find(
      u =>
        u.id === (event.creatorId || event.creator?.id || event.user?.id) ||
        (event.creator?.clerkId && u.clerkId === event.creator.clerkId) ||
        (event.user?.clerkId && u.clerkId === event.user.clerkId)
    ) ||
    (event.creator?.name ? event.creator : null) ||
    event.creator ||
    event.user;

  // Resolve assignee
  const targetAssigneeId = event.assigneeId || event.assignee?.id;
  const assigneeUser =
    targetAssigneeId && targetAssigneeId !== "unassigned"
      ? users.find(
          u =>
            u.id === targetAssigneeId ||
            (event.assignee?.clerkId && u.clerkId === event.assignee.clerkId)
        ) || event.assignee
      : null;

  // Resolve group
  const resolvedGroup =
    event.group || (event.groupId ? groups.find(g => g.id === event.groupId) : null);

  const statusKey = currentStatus?.toUpperCase() || "TODO";
  const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.TODO;
  const StatusIcon = statusConfig.icon;

  const priorityKey = currentPriority?.toUpperCase() || "MEDIUM";
  const priorityConfig = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.MEDIUM;
  const PriorityIcon = priorityConfig.icon;

  const colorConfig = COLOR_MAP[event.color] || COLOR_MAP.blue;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader className="space-y-2 pb-1 text-left">
          <div className="flex items-start gap-2.5">
            <span className={cn("mt-1.5 size-3 shrink-0 rounded-full", colorConfig.dot)} />
            <DialogTitle className="break-words text-lg font-semibold leading-snug">
              {event.title}
            </DialogTitle>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Status Select */}
            <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
              <SelectTrigger
                className={cn(
                  "h-7 w-auto min-w-[110px] gap-1.5 border px-2.5 py-1 text-xs font-medium shadow-none transition-colors focus:ring-1",
                  statusConfig.className
                )}
              >
                <div className="flex items-center gap-1.5 mr-1">
                  {isUpdatingStatus ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <StatusIcon className="size-3.5" />
                  )}
                  <SelectValue>{statusConfig.label}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">
                  <div className="flex items-center gap-2">
                    <CircleDot className="size-3.5 text-slate-500" />
                    <span>To Do</span>
                  </div>
                </SelectItem>
                <SelectItem value="IN_PROGRESS">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-blue-500" />
                    <span>In Progress</span>
                  </div>
                </SelectItem>
                <SelectItem value="DONE">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>Done</span>
                  </div>
                </SelectItem>
                <SelectItem value="CANCELLED">
                  <div className="flex items-center gap-2">
                    <XCircle className="size-3.5 text-rose-500" />
                    <span>Cancelled</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Select */}
            <Select value={currentPriority} onValueChange={handlePriorityChange} disabled={isUpdatingPriority}>
              <SelectTrigger
                className={cn(
                  "h-7 w-auto min-w-[125px] gap-1.5 border px-2.5 py-1 text-xs font-medium shadow-none transition-colors focus:ring-1",
                  priorityConfig.className
                )}
              >
                <div className="flex items-center gap-1.5 mr-1">
                  {isUpdatingPriority ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <PriorityIcon className="size-3.5" />
                  )}
                  <SelectValue>{priorityConfig.label}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="size-3.5 text-emerald-500" />
                    <span>Low Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="MEDIUM">
                  <div className="flex items-center gap-2">
                    <Minus className="size-3.5 text-amber-500" />
                    <span>Medium Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="HIGH">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="size-3.5 text-orange-500" />
                    <span>High Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="URGENT">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-3.5 text-rose-600" />
                    <span>Urgent</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Color indicator */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-full", colorConfig.dot)} />
              <span className="capitalize">{event.color || "blue"}</span>
            </div>

            {/* Group badge */}
            {resolvedGroup && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                <span className="font-medium text-foreground">{resolvedGroup.name}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-3">
          <div className="space-y-4 py-2">
            {/* Date & Time Schedule */}
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Calendar className="size-3.5 text-primary" />
                  <span>Time & Schedule</span>
                </div>
                {durationStr && (
                  <span className="rounded bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {durationStr}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Start</p>
                  <p className="font-medium text-foreground">
                    {isValid(startDate) ? format(startDate, "MMM d, yyyy • h:mm a") : event.startDate}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">End</p>
                  <p className="font-medium text-foreground">
                    {isValid(endDate) ? format(endDate, "MMM d, yyyy • h:mm a") : event.endDate}
                  </p>
                </div>
              </div>
            </div>

            {/* People (Creator and Assignee) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Creator */}
              <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <Avatar className="size-8 shrink-0">
                  <AvatarImage src={creatorUser?.picturePath ?? undefined} alt={creatorUser?.name || "Creator"} />
                  <AvatarFallback className="text-xs">
                    {(creatorUser?.name || "U")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground">Creator</p>
                  <p className="truncate text-xs font-medium text-foreground">
                    {creatorUser?.name || (creatorUser?.clerkId ? `User (${creatorUser.clerkId.slice(-4)})` : "Unknown")}
                  </p>
                </div>
              </div>

              {/* Assignee */}
              <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                {assigneeUser && (assigneeUser.name || assigneeUser.clerkId || assigneeUser.id) ? (
                  <>
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage src={assigneeUser.picturePath ?? undefined} alt={assigneeUser.name || "Assignee"} />
                      <AvatarFallback className="text-xs">{(assigneeUser.name || "A")[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-muted-foreground">Assignee</p>
                      <p className="truncate text-xs font-medium text-foreground">
                        {assigneeUser.name || (assigneeUser.clerkId ? `User (${assigneeUser.clerkId.slice(-4)})` : "Assignee")}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-muted-foreground">Assignee</p>
                      <p className="text-xs italic text-muted-foreground">Unassigned</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <AlignLeft className="size-3.5" />
                <span>Description</span>
              </div>
              {event.description?.trim() ? (
                <div className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed text-foreground">
                  {event.description}
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">No description provided</p>
              )}
            </div>

            {/* Timestamps (Audit) */}
            {(event.createdAt || event.updatedAt) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/40 pt-2 text-[11px] text-muted-foreground/80">
                {event.createdAt && (
                  <span>
                    Created: <span className="font-medium">{safeFormatDate(event.createdAt)}</span>
                  </span>
                )}
                {event.updatedAt && (
                  <span>
                    Updated: <span className="font-medium">{safeFormatDate(event.updatedAt)}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between border-t border-border/40 pt-2 sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
          <EditEventDialog event={{ ...event, status: currentStatus, priority: currentPriority }}>
            <Button type="button" size="sm">
              Edit
            </Button>
          </EditEventDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
