"use client";

import * as React from "react";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { FramedDialog } from "@/components/framed-dialog";
import { getRecentUsers, createInvitationApi } from "@/calendar/requests";
import type { IUser } from "@/calendar/interfaces";
import { useUser } from "@clerk/nextjs";

// Official League of Legends champion avatar icons from Riot CDN
const LOL_CHAMPION_ICONS = [
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Yasuo.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Ahri.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Lux.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Jinx.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Zed.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Teemo.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/LeeSin.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Akali.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Vayne.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Thresh.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Ekko.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Ashe.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Garen.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Riven.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Irelia.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Katarina.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Lucian.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Ezreal.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Darius.png",
  "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/Blitzcrank.png",
];

// Fallback users matching screenshot names if database has few records initially
const FALLBACK_LOL_USERS = [
  { name: "KeeperOfYuleLads", tag: "#9842" },
  { name: "bourdazn", tag: "#NA1" },
  { name: "Scortturbo", tag: "#6969" },
  { name: "Heartineye", tag: "#NA1" },
  { name: "AgoDeus", tag: "#999" },
  { name: "Freakybob7", tag: "#NA1" },
  { name: "Th0mas96", tag: "#NA1" },
  { name: "Raowin", tag: "#NA1" },
  { name: "Goyjak", tag: "#911" },
  { name: "fartin n shi", tag: "#6456" },
  { name: "Zedizije", tag: "#8923" },
  { name: "Donkle", tag: "#6666" },
  { name: "King Frosty", tag: "#KingF" },
  { name: "ShadowBlade", tag: "#EUW" },
  { name: "MysticFox", tag: "#VN1" },
  { name: "DragonSlayer", tag: "#KR1" },
  { name: "PixelKnight", tag: "#JP1" },
  { name: "StarGuardian", tag: "#OCE" },
  { name: "IronSolari", tag: "#LAN" },
  { name: "FrostArcher", tag: "#EUNE" },
];

interface AddFriendsDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  groupId?: string;
}

export function AddFriendsDialog({ children, open: controlledOpen, onOpenChange: controlledOnOpenChange, groupId }: AddFriendsDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;

  const { user: currentClerkUser } = useUser();

  const [gameName, setGameName] = React.useState("");
  const [tagline, setTagline] = React.useState("");
  const [recentUsers, setRecentUsers] = React.useState<Array<{ id: string; name: string; tag: string; avatar: string }>>([]);
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{ text: string; isError?: boolean } | null>(null);

  // Fetch recent 20 users from DB when dialog opens
  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    getRecentUsers(20)
      .then((users: IUser[]) => {
        if (!isMounted) return;

        // Map database users to LoL friend card format
        const mapped = users.map((u, idx) => {
          let name = u.name;
          let tag = "#NA1";

          if (u.clerkId && u.clerkId.includes("#")) {
            const parts = u.clerkId.split("#");
            name = parts[0];
            tag = `#${parts[1]}`;
          } else if (u.name && u.name.includes("#")) {
            const parts = u.name.split("#");
            name = parts[0];
            tag = `#${parts[1]}`;
          } else if (u.clerkId?.startsWith("user_")) {
            name = u.name || `Player_${u.id.slice(0, 5)}`;
            tag = `#${u.id.slice(0, 4).toUpperCase()}`;
          } else {
            name = u.name || `User_${u.id.slice(0, 5)}`;
            tag = `#${u.id.slice(0, 4).toUpperCase()}`;
          }

          const fallbackChamp = LOL_CHAMPION_ICONS[idx % LOL_CHAMPION_ICONS.length];
          const avatar = u.picturePath || fallbackChamp;

          return {
            id: u.id,
            name,
            tag,
            avatar,
          };
        });

        // If fewer than 20 from DB, pad with realistic fallback entries to ensure full 20 suggestions
        if (mapped.length < 20) {
          const needed = 20 - mapped.length;
          for (let i = 0; i < needed; i++) {
            const fallback = FALLBACK_LOL_USERS[(mapped.length + i) % FALLBACK_LOL_USERS.length];
            mapped.push({
              id: `mock-${i}`,
              name: fallback.name,
              tag: fallback.tag,
              avatar: LOL_CHAMPION_ICONS[(mapped.length + i) % LOL_CHAMPION_ICONS.length],
            });
          }
        }

        setRecentUsers(mapped.slice(0, 20));
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
  }, [isOpen]);

  // Handle clicking a user from the recent list
  const handleSelectUser = (userItem: { name: string; tag: string }) => {
    setGameName(userItem.name);
    setTagline(userItem.tag.replace(/^#/, ""));
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
        des: `Friend request sent to ${gameName.trim()} ${fullTag}`,
      });

      setStatusMessage({
        text: `Friend request sent to ${gameName.trim()} ${fullTag}!`,
        isError: false,
      });

      // Clear input after short delay
      setTimeout(() => {
        setGameName("");
        setTagline("");
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
      title="Add Friends"
      trigger={
        children ?? (
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#f0e6d2] transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <UserPlus className="size-4 text-[#c8aa6e]" />
            <span>Invitations</span>
          </button>
        )
      }
    >
      {/* Modal Header */}
      <div className="text-center">
        <h2 className="font-serif text-xl font-bold uppercase tracking-[0.2em] text-[#f0e6d2] sm:text-2xl">Invitations</h2>
        <p className="mt-1 text-xs text-[#a09b8c] sm:text-sm">Already know your friend&apos;s Riot ID? Send them a friend request!</p>
      </div>

      {/* Input & Add Friend row */}
      <form onSubmit={handleAddFriend} className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center border border-[#785a28] bg-[#091428]/90 px-3 py-1.5 shadow-inner transition-colors focus-within:border-[#c8aa6e]">
          <input
            type="text"
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            placeholder="Game Name"
            className="w-full bg-transparent text-sm text-[#f0e6d2] placeholder-[#5c5b57] outline-none"
          />
          <span className="px-2 text-sm font-semibold text-[#a09b8c]">#</span>
          <input
            type="text"
            value={tagline}
            onChange={e => setTagline(e.target.value)}
            placeholder="Tagline"
            className="w-24 bg-transparent text-sm text-[#f0e6d2] placeholder-[#5c5b57] outline-none sm:w-28"
          />
        </div>

        <button
          type="submit"
          disabled={sending || !gameName.trim()}
          className="flex shrink-0 items-center justify-center border border-[#785a28] bg-[#1e2328] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#a09b8c] transition-all hover:border-[#c8aa6e] hover:bg-[#20272c] hover:text-[#f0e6d2] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin text-[#c8aa6e]" />
              Sending...
            </>
          ) : (
            "Add Friend"
          )}
        </button>
      </form>

      {/* Status feedback message */}
      {statusMessage && (
        <div className={`mt-2.5 flex items-center gap-1.5 text-xs ${statusMessage.isError ? "text-red-400" : "text-[#c8aa6e]"}`}>
          {!statusMessage.isError && <Check className="size-3.5" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Subtitle: RECENTLY PLAYED WITH */}
      <div className="mb-3 mt-7">
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#a09b8c]">RECENTLY PLAYED WITH</span>
      </div>

      {/* Users Grid (3 columns, 20 users max) */}
      <div className="max-h-[290px] overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:bg-[#785a28] hover:[&::-webkit-scrollbar-thumb]:bg-[#c8aa6e] [&::-webkit-scrollbar-track]:bg-[#010a13] [&::-webkit-scrollbar]:w-1.5">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#c8aa6e]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
            {recentUsers.map((userItem, index) => (
              <div
                key={`${userItem.id}-${index}`}
                onClick={() => handleSelectUser(userItem)}
                className="group flex cursor-pointer items-center gap-2.5 rounded border border-transparent p-1.5 transition-all hover:border-[#785a28]/60 hover:bg-[#1e282d]/80"
                title={`Click to add ${userItem.name} ${userItem.tag}`}
              >
                {/* LoL champion avatar with round gold border */}
                <div className="relative size-9 shrink-0 overflow-hidden rounded-full border-2 border-[#c8aa6e] shadow-sm ring-1 ring-[#010a13]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={userItem.avatar}
                    alt={userItem.name}
                    className="size-full object-cover transition-transform group-hover:scale-110"
                    onError={e => {
                      // Fallback to champ icon or initial on error
                      e.currentTarget.src = LOL_CHAMPION_ICONS[index % LOL_CHAMPION_ICONS.length];
                    }}
                  />
                </div>

                {/* Name & Tag */}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-[#f0e6d2] transition-colors group-hover:text-[#c8aa6e]">{userItem.name}</div>
                  <div className="truncate text-[10px] text-[#a09b8c]">{userItem.tag}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FramedDialog>
  );
}

export default AddFriendsDialog;
