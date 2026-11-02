"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { FramedDialog } from "@/components/framed-dialog";
import { getRecentUsers, createInvitationApi, type IClerkUser } from "@/calendar/requests";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AddInvitationDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  groupId?: string;
  groupName?: string;
}

function UserAvatar({ src, alt }: { src?: string | null; alt: string }) {
  const [imgSrc, setImgSrc] = React.useState(src);

  React.useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Avatar>
      <AvatarImage src={imgSrc!} />
      <AvatarFallback>{alt.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

export function AddInvitationDialog({ children, open: controlledOpen, onOpenChange: controlledOnOpenChange, groupId, groupName }: AddInvitationDialogProps) {
  const { user } = useUser();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;

  const [gameName, setGameName] = React.useState("");
  const [tagline, setTagline] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<IClerkUser | null>(null);
  const [recentUsers, setRecentUsers] = React.useState<IClerkUser[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{ text: string; isError?: boolean } | null>(null);

  // Fetch recent 20 users from DB (excluding users with invitations in this group) and query Clerk for user profile info
  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    getRecentUsers(20, groupId)
      .then(data => {
        if (!isMounted) return;
        setRecentUsers(data);
      })
      .catch(err => {
        console.error("Error fetching recent users:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, groupId]);

  // Handle clicking a user from the recent list
  const handleSelectUser = (userItem: IClerkUser) => {
    setSelectedUser(userItem);
    setGameName(userItem.userName || "");
    setTagline(userItem.id.slice(-4).toUpperCase());
    setStatusMessage(null);
  };

  // Handle sending friend/group invitation
  const handleAddFriend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gameName.trim()) return;

    setSending(true);
    setStatusMessage(null);

    const fullTag = tagline.trim() ? `#${tagline.trim().replace(/^#/, "")}` : "#0001";
    const inviteCode = `${gameName.trim()}${fullTag}`;

    try {
      await createInvitationApi({
        code: inviteCode,
        groupId: groupId,
        userSentId: user?.id,
        userReceivedId: selectedUser?.id,
        des: `Invite request sent to ${gameName.trim()} `,
      });

      setStatusMessage({
        text: `Invite request sent to ${gameName.trim()}!`,
        isError: false,
      });

      if (selectedUser) {
        setRecentUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      }

      window.dispatchEvent(new CustomEvent("invitations-updated"));

      // Clear input after short delay
      setTimeout(() => {
        setGameName("");
        setTagline("");
        setSelectedUser(null);
      }, 1500);
    } catch (err: any) {
      console.error("Error sending invitation:", err);
      setStatusMessage({
        text: err?.message || "Failed to send invitation. Please try again.",
        isError: true,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <FramedDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={groupName ? `Invite to ${groupName}` : "Add Friends"}
      trigger={
        children ?? (
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <UserPlus className="size-4 text-[#9e7938] dark:text-[#c8aa6e]" />
            <span>Invitations</span>
          </Button>
        )
      }
    >
      {/* Modal Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-[#f0e6d2] sm:text-2xl">Invitation to {groupName || "Group"}</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-[#a09b8c] sm:text-sm">Send invitation to your co-workers to join your group</p>
      </div>

      {/* Input & Add Friend row */}
      <form onSubmit={handleAddFriend} className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex flex-1 items-center">
          <Input
            type="text"
            value={gameName}
            onChange={e => {
              setGameName(e.target.value);
              if (selectedUser && e.target.value !== selectedUser.userName) {
                setSelectedUser(null);
              }
            }}
            placeholder="User name"
            className="h-10 rounded-md border border-[#c8aa6e]/60 bg-slate-50/90 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-[#9e7938] focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-[#785a28] dark:bg-[#091428]/90 dark:text-[#f0e6d2] dark:placeholder:text-[#5c5b57] dark:focus-visible:border-[#c8aa6e]"
          />
        </div>

        <Button
          type="submit"
          disabled={sending || !gameName.trim()}
          className="h-10 shrink-0 rounded-md border border-[#c8aa6e] bg-[#fbf9f5] px-5 text-xs font-bold uppercase tracking-wider text-[#785a28] shadow-none hover:border-[#9e7938] hover:bg-[#f3ede0] hover:text-[#5a431c] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#785a28] dark:bg-[#1e2328] dark:text-[#a09b8c] dark:hover:border-[#c8aa6e] dark:hover:bg-[#20272c] dark:hover:text-[#f0e6d2]"
        >
          {sending ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin text-[#9e7938] dark:text-[#c8aa6e]" />
              Sending...
            </>
          ) : (
            "Invite to group"
          )}
        </Button>
      </form>

      {/* Status feedback message */}
      {statusMessage && (
        <div
          className={`mt-2.5 flex items-center gap-1.5 text-xs ${statusMessage.isError ? "text-red-600 dark:text-red-400" : "text-[#785a28] dark:text-[#c8aa6e]"}`}
        >
          {!statusMessage.isError && <Check className="size-3.5" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Users Grid (3 columns, 20 users max) */}
      <div className="mt-4 max-h-[290px] overflow-y-auto border pr-1 [&::-webkit-scrollbar-thumb]:bg-[#c8aa6e]/60 hover:[&::-webkit-scrollbar-thumb]:bg-[#9e7938] dark:[&::-webkit-scrollbar-thumb]:bg-[#785a28] dark:hover:[&::-webkit-scrollbar-thumb]:bg-[#c8aa6e] [&::-webkit-scrollbar-track]:bg-slate-100 dark:[&::-webkit-scrollbar-track]:bg-[#010a13] [&::-webkit-scrollbar]:w-1.5">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#9e7938] dark:text-[#c8aa6e]" />
          </div>
        ) : recentUsers.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-slate-500 dark:text-[#a09b8c]">There is no users.</div>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
            {recentUsers.map((userItem, index) => (
              <div
                key={`${userItem.id}-${index}`}
                onClick={() => handleSelectUser(userItem)}
                className="group flex cursor-pointer items-center gap-2.5 rounded border border-transparent p-1.5 transition-all hover:border-[#c8aa6e]/50 hover:bg-amber-50/70 dark:hover:border-[#785a28]/60 dark:hover:bg-[#1e282d]/80"
                title={`Click to add ${userItem.userName || "User"}`}
              >
                {/* LoL champion avatar using Next Image */}
                <UserAvatar src={userItem.imageUrl} alt={userItem.userName || "User"} />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-slate-800 transition-colors group-hover:text-[#9e7938] dark:text-[#f0e6d2] dark:group-hover:text-[#c8aa6e]">
                    {userItem.userName || "User"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FramedDialog>
  );
}

export default AddInvitationDialog;
