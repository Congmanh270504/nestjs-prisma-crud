"use client";

import * as React from "react";
import { Check, X, CircleSlash, Loader2, User as UserIcon, Mail } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { FramedDialog } from "@/components/framed-dialog";
import { getInvitations, updateInvitationStatusApi, deleteInvitationApi, getClerkUsersApi, type IGroupInvitation, type IClerkUser } from "@/calendar/requests";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPusherClient } from "@/lib/pusher";

interface PendingInvitationsDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PendingInvitationsDialog({ children, open: controlledOpen, onOpenChange: controlledOnOpenChange }: PendingInvitationsDialogProps) {
  const { user } = useUser();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;

  const [invitations, setInvitations] = React.useState<IGroupInvitation[]>([]);
  const [clerkUsersMap, setClerkUsersMap] = React.useState<Record<string, IClerkUser>>({});
  const [loading, setLoading] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);

  const fetchPendingInvitations = React.useCallback(async () => {
    if (!user?.id) {
      setInvitations([]);
      return;
    }

    setLoading(true);
    try {
      const data = await getInvitations({ status: "PENDING", clerkId: user.id });
      setInvitations(data);

      // Collect clerkIds from userSent and userReceived
      const clerkIds = Array.from(
        new Set(data.flatMap(inv => [inv.userSent?.clerkId, inv.userReceived?.clerkId]).filter((id): id is string => Boolean(id && id.startsWith("user_"))))
      );

      if (clerkIds.length > 0) {
        const profiles = await getClerkUsersApi(clerkIds);
        const map: Record<string, IClerkUser> = {};
        for (const p of profiles) {
          map[p.id] = p;
        }
        setClerkUsersMap(prev => ({ ...prev, ...map }));
      }
    } catch (err) {
      console.error("Error fetching pending invitations:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch count on mount, listen to local updates and Pusher realtime events
  React.useEffect(() => {
    fetchPendingInvitations();

    const handleUpdate = () => {
      fetchPendingInvitations();
    };

    window.addEventListener("invitations-updated", handleUpdate);
    window.addEventListener("groups-updated", handleUpdate);

    // Setup Pusher realtime listener
    const pusher = getPusherClient();
    let channel: any = null;

    if (pusher) {
      channel = pusher.subscribe("invitations-channel");

      channel.bind("invitation-received", () => {
        fetchPendingInvitations();
        window.dispatchEvent(new CustomEvent("invitations-updated"));
      });

      channel.bind("invitation-updated", () => {
        fetchPendingInvitations();
        window.dispatchEvent(new CustomEvent("invitations-updated"));
        window.dispatchEvent(new CustomEvent("groups-updated"));
      });

      channel.bind("invitation-deleted", () => {
        fetchPendingInvitations();
        window.dispatchEvent(new CustomEvent("invitations-updated"));
        window.dispatchEvent(new CustomEvent("groups-updated"));
      });
    }

    return () => {
      window.removeEventListener("invitations-updated", handleUpdate);
      window.removeEventListener("groups-updated", handleUpdate);
      if (channel && pusher) {
        channel.unbind_all();
        pusher.unsubscribe("invitations-channel");
      }
    };
  }, [fetchPendingInvitations]);

  // Re-fetch when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      fetchPendingInvitations();
    }
  }, [isOpen, fetchPendingInvitations]);

  const handleAction = async (invitationId: string, action: "ACCEPT" | "REJECT" | "CANCEL") => {
    setActingId(invitationId);
    try {
      if (action === "ACCEPT") {
        await updateInvitationStatusApi(invitationId, "ACCEPTED");
      } else if (action === "REJECT") {
        await updateInvitationStatusApi(invitationId, "REJECTED");
      } else {
        await updateInvitationStatusApi(invitationId, "CANCELLED");
      }

      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      window.dispatchEvent(new CustomEvent("invitations-updated"));
      window.dispatchEvent(new CustomEvent("groups-updated"));
    } catch (err) {
      console.error(`Error performing action ${action} on invitation:`, err);
    } finally {
      setActingId(null);
    }
  };

  return (
    <FramedDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Friend Requests"
      className="max-w-[460px]"
      innerClassName="md:px-2 md:py-4"
      trigger={
        children ?? (
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Mail className="size-4 text-[#9e7938] dark:text-[#c8aa6e]" />
            <span className="flex-1 text-left">Friend Requests</span>
            {invitations.length > 0 && (
              <span className="flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black shadow-sm dark:bg-[#c8aa6e] dark:text-[#010a13]">
                {invitations.length}
              </span>
            )}
          </Button>
        )
      }
    >
      {/* Title matching League client UI: FRIEND REQUESTS (count) */}
      <div className="mb-6 text-center">
        <h2 className="text-base font-bold uppercase tracking-[0.2em]">FRIEND REQUESTS ({invitations.length})</h2>
      </div>

      {/* Invitations List */}
      <div className="max-h-[320px] min-h-[180px] overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 dark:hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
        {loading && invitations.length === 0 ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-slate-500 dark:text-zinc-400" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center text-xs text-slate-500 dark:text-zinc-400">
            <span>No pending friend requests.</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {invitations.map(invitation => {
              // Find clerk profile for the sender
              const senderClerkId = invitation.userSent?.clerkId;
              const clerkUser = senderClerkId ? clerkUsersMap[senderClerkId] : null;

              const displayName = clerkUser?.userName || (senderClerkId ? `User (${senderClerkId.slice(-4)})` : invitation.code || "Player");

              const avatarSrc = clerkUser?.imageUrl || undefined;
              const isActing = actingId === invitation.id;

              return (
                <div
                  key={invitation.id}
                  className="group flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-slate-100/90 dark:hover:bg-zinc-800/60"
                >
                  {/* Left: Avatar & Text */}
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-9 shrink-0 border border-slate-200 bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800">
                      {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
                      <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-zinc-100">{displayName}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Group Request
                        {invitation.group?.name ? ` • ${invitation.group.name}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions (✓  ✕) */}
                  <div className="flex shrink-0 items-center gap-2">
                    {isActing ? (
                      <Loader2 className="size-4 animate-spin text-slate-500 dark:text-zinc-400" />
                    ) : (
                      <>
                        {/* Accept */}
                        <button
                          type="button"
                          title="Accept"
                          onClick={() => handleAction(invitation.id, "ACCEPT")}
                          className="flex size-7 items-center justify-center rounded-md text-emerald-600 transition-all hover:scale-110 hover:bg-emerald-100/70 active:scale-95 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                        >
                          <Check className="size-4 stroke-[2.5]" />
                        </button>

                        {/* Decline */}
                        <button
                          type="button"
                          title="Decline"
                          onClick={() => handleAction(invitation.id, "REJECT")}
                          className="flex size-7 items-center justify-center rounded-md text-rose-600 transition-all hover:scale-110 hover:bg-rose-100/70 active:scale-95 dark:text-rose-400 dark:hover:bg-rose-950/50"
                        >
                          <X className="size-4 stroke-[2.5]" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FramedDialog>
  );
}

export default PendingInvitationsDialog;
