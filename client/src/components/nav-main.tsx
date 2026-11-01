"use client";

import * as React from "react";
import { ChevronRight, Plus, Users, Loader2, Mail, Clock, Trash2, UserPlus } from "lucide-react";
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
import { Button } from "./ui/button";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { getGroupsApi, getClerkUsersApi, deleteInvitationApi, type IGroup, type IClerkUser, type IGroupInvitation } from "@/calendar/requests";
import { cn } from "@/lib/utils";
import AddInvitationDialog from "@/calendar/components/dialogs/add-invitation-dialog";

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-rose-500",
  yellow: "bg-amber-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  gray: "bg-slate-400",
};

export function NavMain({
  items,
}: {
  items?: {
    title: string;
    url: string;
    icon?: any;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const { user, isSignedIn, isLoaded } = useUser();
  const [groups, setGroups] = React.useState<IGroup[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [clerkUsersMap, setClerkUsersMap] = React.useState<Record<string, IClerkUser>>({});
  const [userDelete, setUserDelete] = React.useState("");
  const [deletingInvite, setDeletingInvite] = React.useState<{
    invitation: IGroupInvitation;
    displayName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  const fetchGroupsAndMembers = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const groupData = await getGroupsApi({ clerkId: user.id });
      setGroups(groupData);

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
  }, [user?.id]);

  React.useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchGroupsAndMembers();
    }
  }, [isSignedIn, user?.id, fetchGroupsAndMembers]);

  // Listen for groups-updated or invitations-updated events to re-fetch
  React.useEffect(() => {
    const handleUpdate = () => {
      fetchGroupsAndMembers();
    };

    window.addEventListener("groups-updated", handleUpdate);
    window.addEventListener("invitations-updated", handleUpdate);

    return () => {
      window.removeEventListener("groups-updated", handleUpdate);
      window.removeEventListener("invitations-updated", handleUpdate);
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

            return (
              <Collapsible key={group.id} asChild defaultOpen={true} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={group.name} className="flex items-center gap-2">
                      <span className={cn("size-2 shrink-0 rounded-full", dotColor)} />
                      <span className="flex-1 truncate text-left font-medium">{group.name}</span>
                      <span className="text-[10px] font-normal text-muted-foreground">({invitations.length})</span>
                      <ChevronRight className="ml-auto size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub className="mr-0 pr-0">
                      {invitations.length > 0 &&
                        invitations.map(invitation => {
                          const isPending = invitation.status === "PENDING";
                          const clerkId = invitation.userReceived?.clerkId;
                          const clerkUser = clerkId ? clerkUsersMap[clerkId] : null;

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

                                  <span className="flex-1 truncate text-xs">{displayName}</span>

                                  {isPending && (
                                    <span
                                      title="Pending invitation"
                                      className="py-0.2 flex shrink-0 items-center gap-0.5 rounded border border-amber-500/25 bg-amber-500/15 px-1 text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400"
                                    >
                                      <Clock className="size-2.5" />
                                      <span>Pending</span>
                                    </span>
                                  )}

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
                                </div>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      <AddInvitationDialog>
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
