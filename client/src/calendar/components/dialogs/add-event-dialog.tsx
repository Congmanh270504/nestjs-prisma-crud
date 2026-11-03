"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useUser } from "@clerk/nextjs";
import { AlertTriangle, User } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import { useDisclosure } from "@/hooks/use-disclosure";
import { useCalendar } from "@/calendar/contexts/calendar-context";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TimeInput } from "@/components/ui/time-input";
import { SingleDayPicker } from "@/components/ui/single-day-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormField, FormLabel, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogClose, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { createEventApi, getUsers } from "@/calendar/requests";
import { eventSchema } from "@/calendar/schemas";
import { cn } from "@/lib/utils";

import type { TimeValue } from "react-aria-components";
import type { TEventFormData } from "@/calendar/schemas";
import type { IEvent, IUser } from "@/calendar/interfaces";
import { ScrollArea } from "@/components/ui/scroll-area";

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-rose-500",
  yellow: "bg-amber-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  gray: "bg-slate-400",
};

interface IProps {
  children: React.ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
}

export function AddEventDialog({ children, startDate, startTime }: IProps) {
  const { users, setLocalEvents, isMockMode, selectedGroupId } = useCalendar();
  const { user: clerkUser } = useUser();
  const searchParams = useSearchParams();
  const queryGroupId = searchParams.get("groupId") || selectedGroupId || "";

  const { isOpen, onClose, onToggle } = useDisclosure();

  // Users belonging to queryGroupId only
  const [groupUsers, setGroupUsers] = useState<IUser[]>(users);

  useEffect(() => {
    let isMounted = true;
    if (queryGroupId) {
      getUsers(queryGroupId).then(fetched => {
        if (isMounted) setGroupUsers(fetched);
      });
    } else {
      setGroupUsers(users);
    }
    return () => {
      isMounted = false;
    };
  }, [queryGroupId, users]);

  // Find the currently logged-in user in DB
  const currentDbUser =
    groupUsers.find(u => u.clerkId === clerkUser?.id || u.id === clerkUser?.id) || users.find(u => u.clerkId === clerkUser?.id || u.id === clerkUser?.id);
  const currentUserId = currentDbUser?.id || clerkUser?.id || "";

  const form = useForm<TEventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      user: currentDbUser?.id || clerkUser?.id || groupUsers[0]?.id || "unassigned",
      title: "",
      description: "",
      startDate: typeof startDate !== "undefined" ? startDate : undefined,
      startTime: typeof startTime !== "undefined" ? startTime : undefined,
      color: "blue",
      groupId: queryGroupId || undefined,
      status: "TODO",
      priority: "MEDIUM",
    },
  });

  const onSubmit = async (values: TEventFormData) => {
    // values.user is the chosen Assignee among group users
    const assignedUser =
      values.user && values.user !== "unassigned" ? groupUsers.find(u => u.id === values.user) || users.find(u => u.id === values.user) || null : null;
    const assigneeId = assignedUser?.id || (values.user && values.user !== "unassigned" ? values.user : undefined);

    const startDateTime = new Date(values.startDate);
    startDateTime.setHours(values.startTime.hour, values.startTime.minute);

    const endDateTime = new Date(values.endDate);
    endDateTime.setHours(values.endTime.hour, values.endTime.minute);

    const targetGroupId = queryGroupId || undefined;

    // Creator is ALWAYS the current logged-in user
    const creatorUser = currentDbUser || {
      id: currentUserId,
      clerkId: clerkUser?.id,
      name: clerkUser?.fullName || clerkUser?.username || "You",
      picturePath: clerkUser?.imageUrl,
    };

    const tempId = `temp-${Date.now()}`;
    const newEvent: IEvent = {
      id: tempId,
      title: values.title,
      description: values.description,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      color: values.color,
      user: creatorUser,
      creatorId: currentUserId,
      creator: creatorUser,
      assigneeId: assigneeId,
      assignee: assignedUser,
      groupId: targetGroupId,
      status: values.status,
      priority: values.priority,
    };

    setLocalEvents(prev => [...prev, newEvent]);
    onClose();
    form.reset();

    if (!isMockMode) {
      try {
        const created = await createEventApi({
          title: values.title,
          description: values.description,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          color: values.color,
          userId: currentUserId || assignedUser?.id || users[0]?.id || "", // Creator ID = logged in user
          assigneeId: assigneeId, // Assignee ID = selected user
          groupId: targetGroupId,
          status: values.status,
          priority: values.priority,
        });
        if (created?.id) {
          setLocalEvents(prev => prev.map(e => (e.id === tempId ? { ...e, ...created, id: created.id } : e)));
        }
        window.dispatchEvent(new CustomEvent("events-updated"));
      } catch {
        // Handle or ignore offline sync error
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      const defaultAssignee = currentDbUser?.id || clerkUser?.id || (groupUsers.length > 0 ? groupUsers[0]?.id : "unassigned");
      form.reset({
        user: defaultAssignee,
        title: "",
        description: "",
        startDate,
        startTime,
        color: "blue",
        groupId: queryGroupId || undefined,
        status: "TODO",
        priority: "MEDIUM",
      });
    }
  }, [isOpen, startDate, startTime, queryGroupId, groupUsers, currentDbUser?.id, clerkUser?.id, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <Form {...form}>
            <form id="event-form" onSubmit={form.handleSubmit(onSubmit)} className="grid space-y-1 p-1">
              <FormField
                control={form.control}
                name="user"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select an assignee" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="unassigned" className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <User className="size-3.5" />
                              </div>
                              <p className="truncate italic text-muted-foreground">Unassigned</p>
                            </div>
                          </SelectItem>
                          {groupUsers.map(user => (
                            <SelectItem key={user.id} value={user.id} className="flex-1">
                              <div className="flex items-center gap-2">
                                <Avatar key={user.id} className="size-6">
                                  <AvatarImage src={user.picturePath ?? undefined} alt={user.name} />
                                  <AvatarFallback className="text-xxs">{user.name[0]}</AvatarFallback>
                                </Avatar>

                                <p className="truncate">{user.name}</p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor="title">Title</FormLabel>

                    <FormControl>
                      <Input id="title" placeholder="Enter a title" data-invalid={fieldState.invalid} {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormLabel htmlFor="startDate">Start Date</FormLabel>

                      <FormControl>
                        <SingleDayPicker
                          id="startDate"
                          value={field.value}
                          onSelect={date => {
                            field.onChange(date as Date);
                            if (date) {
                              form.setValue("startTime", { hour: 0, minute: 0 }, { shouldValidate: true });
                            }
                          }}
                          placeholder="Select a date"
                          data-invalid={fieldState.invalid}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Start Time</FormLabel>

                      <FormControl>
                        <TimeInput value={field.value as TimeValue} onChange={field.onChange} hourCycle={12} data-invalid={fieldState.invalid} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <SingleDayPicker
                          value={field.value}
                          onSelect={date => {
                            field.onChange(date as Date);
                            if (date) {
                              form.setValue("endTime", { hour: 23, minute: 59 }, { shouldValidate: true });
                            }
                          }}
                          placeholder="Select a date"
                          data-invalid={fieldState.invalid}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormLabel>End Time</FormLabel>

                      <FormControl>
                        <TimeInput value={field.value as TimeValue} onChange={field.onChange} hourCycle={12} data-invalid={fieldState.invalid} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-start justify-between gap-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-invalid={fieldState.invalid}>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TODO">
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-slate-400" />
                                <span>To Do</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="IN_PROGRESS">
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-blue-500" />
                                <span>In Progress</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="DONE">
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-emerald-500" />
                                <span>Done</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="CANCELLED">
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-rose-500" />
                                <span>Cancelled</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-invalid={fieldState.invalid}>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-emerald-500" />
                                <span>Low</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="MEDIUM">
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-amber-500" />
                                <span>Medium</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="HIGH">
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-orange-500" />
                                <span>High</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="URGENT">
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-rose-600" />
                                <span>Urgent</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-invalid={fieldState.invalid}>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="blue">
                              <div className="flex items-center gap-2">
                                <div className="size-3.5 rounded-full bg-blue-600" />
                                Blue
                              </div>
                            </SelectItem>

                            <SelectItem value="green">
                              <div className="flex items-center gap-2">
                                <div className="size-3.5 rounded-full bg-green-600" />
                                Green
                              </div>
                            </SelectItem>

                            <SelectItem value="red">
                              <div className="flex items-center gap-2">
                                <div className="size-3.5 rounded-full bg-red-600" />
                                Red
                              </div>
                            </SelectItem>

                            <SelectItem value="yellow">
                              <div className="flex items-center gap-2">
                                <div className="size-3.5 rounded-full bg-yellow-600" />
                                Yellow
                              </div>
                            </SelectItem>

                            <SelectItem value="purple">
                              <div className="flex items-center gap-2">
                                <div className="size-3.5 rounded-full bg-purple-600" />
                                Purple
                              </div>
                            </SelectItem>

                            <SelectItem value="orange">
                              <div className="flex items-center gap-2">
                                <div className="size-3.5 rounded-full bg-orange-600" />
                                Orange
                              </div>
                            </SelectItem>

                            <SelectItem value="gray">
                              <div className="flex items-center gap-2">
                                <div className="size-3.5 rounded-full bg-neutral-600" />
                                Gray
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>

                    <FormControl>
                      <Textarea {...field} value={field.value} data-invalid={fieldState.invalid} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>

          <Button form="event-form" type="submit">
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
