"use client";

import * as React from "react";
import { ChevronRight, Plus, Users, Loader2, Mail, Clock, Trash2, UserPlus, Crown } from "lucide-react";
import { useUser } from "@clerk/nextjs";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ManageGroupsDialog from "@/calendar/components/dialogs/manage-groups-dialog";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { getGroupsApi, getClerkUsersApi, deleteInvitationApi, type IGroup, type IClerkUser, type IGroupInvitation } from "@/calendar/requests";
import { cn } from "@/lib/utils";
import AddInvitationDialog from "@/calendar/components/dialogs/add-invitation-dialog";
import { getPusherClient } from "@/lib/pusher";

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-rose-500",
  yellow: "bg-amber-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  gray: "bg-slate-400",
};

const GROUP_THEME_MAP: Record<
  string,
  {
    itemActive: string;
    buttonActive: string;
  }
> = {
  blue: {
    itemActive: "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 shadow-sm",
    buttonActive: "bg-blue-100/90 text-blue-950 dark:bg-blue-900/60 dark:text-blue-100 font-semibold",
  },
  green: {
    itemActive: "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 shadow-sm",
    buttonActive: "bg-emerald-100/90 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100 font-semibold",
  },
  red: {
    itemActive: "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 shadow-sm",
    buttonActive: "bg-rose-100/90 text-rose-950 dark:bg-rose-900/60 dark:text-rose-100 font-semibold",
  },
  yellow: {
    itemActive: "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 shadow-sm",
    buttonActive: "bg-amber-100/90 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100 font-semibold",
  },
  gold: {
    itemActive: "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 shadow-sm",
    buttonActive: "bg-amber-100/90 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100 font-semibold",
  },
  purple: {
    itemActive: "bg-purple-50/80 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 shadow-sm",
    buttonActive: "bg-purple-100/90 text-purple-950 dark:bg-purple-900/60 dark:text-purple-100 font-semibold",
  },
  orange: {
    itemActive: "bg-orange-50/80 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60 shadow-sm",
    buttonActive: "bg-orange-100/90 text-orange-950 dark:bg-orange-900/60 dark:text-orange-100 font-semibold",
  },
  gray: {
    itemActive: "bg-slate-100 dark:bg-slate-850/60 border-slate-300 dark:border-slate-700 shadow-sm",
    buttonActive: "bg-slate-200 text-slate-950 dark:bg-slate-700 dark:text-slate-100 font-semibold",
  },
};

export function NavMain() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const selectedGroupId = searchParams.get("groupId");

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});
  const [groups, setGroups] = React.useState<IGroup[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [clerkUsersMap, setClerkUsersMap] = React.useState<Record<string, IClerkUser>>({});
  const [userDelete, setUserDelete] = React.useState("");
  const [deletingInvite, setDeletingInvite] = React.useState<{
    invitation: IGroupInvitation;
    displayName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Automatically expand group if it matches selectedGroupId from URL
  React.useEffect(() => {
    if (selectedGroupId) {
      setOpenGroups(prev => ({ ...prev, [selectedGroupId]: true }));
    }
  }, [selectedGroupId]);

  const handleSelectGroup = (groupId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("groupId", groupId);
    router.push(`${pathname}?${params.toString()}`);
    setOpenGroups(prev => ({ ...prev, [groupId]: true }));
  };

  const handleConfirmDelete = async () => {
    if (!deletingInvite) return;
    setIsDeleting(true);
    try {
      await deleteInvitationApi(deletingInvite.invitation.id);
      setDeletingInvite(null);
      fetchGroupsAndMembers();
      window.dispatchEvent(new CustomEvent("invitations-updated"));
    } catch (error) {
      console.error("Error deleting invitation:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const searchParamsRef = React.useRef(searchParams);
  searchParamsRef.current = searchParams;
  const pathnameRef = React.useRef(pathname);
  pathnameRef.current = pathname;

  const fetchGroupsAndMembers = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const groupData = await getGroupsApi({ clerkId: user.id });
      setGroups(groupData);

      // Auto redirect to first group in sidebar if query param is missing or invalid
      if (groupData.length > 0) {
        const currentParams = searchParamsRef.current;
        const currentGroupId = currentParams.get("groupId");
        const exists = groupData.some(g => g.id === currentGroupId);
        if (!currentGroupId || !exists) {
          const firstGroupId = groupData[0].id;
          const params = new URLSearchParams(currentParams.toString());
          params.set("groupId", firstGroupId);
          router.replace(`${pathnameRef.current}?${params.toString()}`);
          setOpenGroups(prev => ({ ...prev, [firstGroupId]: true }));
        }
      }

      // Collect all clerkIds from userReceived in invitations
      const allClerkIds = Array.from(
        new Set(
          groupData
            .flatMap(g => g.invitations || [])
            .map(inv => inv.userReceived?.clerkId)
            .filter((id): id is string => Boolean(id && id.startsWith("user_")))
        )
      );

      if (allClerkIds.length > 0) {
        const clerkProfiles = await getClerkUsersApi(allClerkIds);
        const map: Record<string, IClerkUser> = {};
        for (const profile of clerkProfiles) {
          map[profile.id] = profile;
        }
        setClerkUsersMap(prev => ({ ...prev, ...map }));
      }
    } catch (err) {
      console.error("Error loading groups for sidebar:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, router]);

  React.useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchGroupsAndMembers();
    }
  }, [isSignedIn, user?.id, fetchGroupsAndMembers]);

  // Listen for groups-updated or invitations-updated events to re-fetch + Pusher realtime events
  React.useEffect(() => {
    const handleUpdate = () => {
      fetchGroupsAndMembers();
    };

    window.addEventListener("groups-updated", handleUpdate);
    window.addEventListener("invitations-updated", handleUpdate);

    // Setup Pusher realtime listener
    const pusher = getPusherClient();
    let invitationsChannel: any = null;
    let groupsChannel: any = null;

    if (pusher) {
      invitationsChannel = pusher.subscribe("invitations-channel");

      invitationsChannel.bind("invitation-updated", () => {
        fetchGroupsAndMembers();
      });
      invitationsChannel.bind("invitation-received", () => {
        fetchGroupsAndMembers();
      });
      invitationsChannel.bind("invitation-deleted", () => {
        fetchGroupsAndMembers();
      });

      groupsChannel = pusher.subscribe("groups-channel");

      groupsChannel.bind("group-created", () => {
        fetchGroupsAndMembers();
      });
      groupsChannel.bind("group-updated", () => {
        fetchGroupsAndMembers();
      });
      groupsChannel.bind("group-deleted", () => {
        fetchGroupsAndMembers();
      });
    }

    return () => {
      window.removeEventListener("groups-updated", handleUpdate);
      window.removeEventListener("invitations-updated", handleUpdate);

      if (pusher) {
        if (invitationsChannel) {
          invitationsChannel.unbind_all();
          pusher.unsubscribe("invitations-channel");
        }
        if (groupsChannel) {
          groupsChannel.unbind_all();
          pusher.unsubscribe("groups-channel");
        }
      }
    };
  }, [fetchGroupsAndMembers]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="p-0">
        <ManageGroupsDialog>
          <Button variant="ghost" className="w-full justify-between px-2 text-left hover:bg-sidebar-accent">
            <div className="flex items-center gap-2">
              <Users className="size-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground">Groups</span>
            </div>
            <Plus className="size-3.5 text-muted-foreground" />
          </Button>
        </ManageGroupsDialog>
      </SidebarGroupLabel>

      <SidebarMenu className="mt-1">
        {loading && groups.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <div className="px-3 py-2 text-center text-xs text-muted-foreground">No groups yet.</div>
        ) : (
          groups.map(group => {
            const invitations = group.invitations || [];
            const dotColor = COLOR_MAP[group.color || "gray"] || "bg-slate-400";
            const isSelected = selectedGroupId === group.id;
            const isOpen = openGroups[group.id] ?? (isSelected || false);
            const theme = GROUP_THEME_MAP[group.color || "gray"] || GROUP_THEME_MAP.gray;

            return (
              <Collapsible
                key={group.id}
                asChild
                open={isOpen}
                onOpenChange={open => setOpenGroups(prev => ({ ...prev, [group.id]: open }))}
                className="group/collapsible"
              >
                <SidebarMenuItem className={cn("rounded-lg border border-transparent transition-all duration-200")}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={group.name}
                      onClick={() => handleSelectGroup(group.id)}
                      className={cn("flex items-center gap-2 transition-colors", isSelected && theme.buttonActive)}
                    >
                      <span className={cn("size-2 shrink-0 rounded-full", dotColor)} />
                      <span className="flex-1 truncate text-left font-medium">{group.name}</span>
                      <span className="text-[10px] font-normal text-muted-foreground">({invitations.length})</span>
                      <ChevronRight className="ml-auto size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub
                      className={cn(
                        "mr-0 pr-0",
                        isSelected
                          ? cn("border p-0.5", theme.itemActive, "rounded-lg border border-transparent transition-all duration-200")
                          : "hover:bg-sidebar-accent/40"
                      )}
                    >
                      {invitations.length > 0 &&
                        invitations.map(invitation => {
                          const isPending = invitation.status === "PENDING";
                          const clerkId = invitation.userReceived?.clerkId;
                          const clerkUser = clerkId ? clerkUsersMap[clerkId] : null;
                          const isOwner = invitation.userReceived?.id === group.ownerId;

                          const displayName = clerkUser?.userName || (clerkId ? `User (${clerkId.slice(-4)})` : invitation.code);
                          const avatarSrc = clerkUser?.imageUrl || undefined;

                          return (
                            <SidebarMenuSubItem key={invitation.id} className="my-0.5">
                              <SidebarMenuSubButton
                                asChild
                                className={cn(
                                  "flex h-8 items-center gap-2 rounded px-2 transition-colors",
                                  isPending
                                    ? "bg-slate-200/80 text-slate-700 hover:bg-slate-300/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                                )}
                              >
                                <div className="flex w-full items-center gap-2">
                                  <Avatar className="size-5 shrink-0 border border-black/10 dark:border-white/10">
                                    {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
                                    <AvatarFallback className="text-[9px] font-bold">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>

                                  <span className="flex flex-1 items-center gap-2 truncate text-xs">
                                    {displayName} {isOwner && <Crown className="size-3.5 text-yellow-500" />}
                                  </span>

                                  {isPending && (
                                    <span
                                      title="Pending invitation"
                                      className="py-0.2 flex shrink-0 items-center gap-0.5 rounded border border-amber-500/25 bg-amber-500/15 px-1 text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400"
                                    >
                                      <Clock className="size-2.5" />
                                    </span>
                                  )}

                                  {!isOwner ||
                                    isPending && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-6 shrink-0 text-red-600 hover:bg-red-600/10 hover:text-red-700"
                                        title="Remove member"
                                        onClick={e => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDeletingInvite({
                                            invitation,
                                            displayName,
                                          });
                                          setUserDelete(displayName);
                                        }}
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    )}
                                </div>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}

                      <AddInvitationDialog groupId={group.id} groupName={group.name}>
                        <Button variant="ghost" className="w-full justify-start gap-2 px-2 text-left">
                          <UserPlus className="size-4" />
                          <span>Invite friends</span>
                        </Button>
                      </AddInvitationDialog>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })
        )}
      </SidebarMenu>

      <DeleteConfirmDialog
        open={Boolean(deletingInvite)}
        onOpenChange={open => {
          if (!open && !isDeleting) setDeletingInvite(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Remove Member"
        description={
          <div>
            Are you sure you want to remove
            <span className="mx-1 font-bold underline">{userDelete || "this member"}</span>
            from group
            <span className="ml-1 font-bold">{groups.filter(group => group.id === deletingInvite?.invitation.groupId)[0]?.name}</span>?
          </div>
        }
        actionText="Delete"
        cancelText="Cancel"
      />
    </SidebarGroup>
  );
}

export default NavMain;
