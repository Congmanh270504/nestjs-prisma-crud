"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { ArrowUpRight, AudioWaveform, Command, GalleryVerticalEnd, LogIn, Sparkles, SquareTerminal, UserPlus, Users } from "lucide-react";
import * as React from "react";

import { AddInvitationDialog } from "@/calendar/components/dialogs/add-invitation-dialog";
import { PendingInvitationsDialog } from "@/calendar/components/dialogs/pending-invitations-dialog";
import CalendarSettings from "@/calendar/components/dialogs/calendar-settings";
import { ManageGroupsDialog } from "@/calendar/components/dialogs/manage-groups-dialog";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarRail, useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isSignedIn, isLoaded, user } = useUser();
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  const currentUser = React.useMemo(() => {
    if (!user) return data.user;
    return {
      name: user.username || user.firstName || "User",
      email: user.primaryEmailAddress?.emailAddress || "",
      avatar: user.imageUrl || data.user.avatar,
    };
  }, [user]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {!isLoaded ? (
          <div className="flex flex-col gap-2 p-3">
            <div className="h-28 w-full animate-pulse rounded-lg bg-sidebar-accent/50" />
          </div>
        ) : isSignedIn ? (
          <>
            <NavMain />

            <PendingInvitationsDialog />

            <CalendarSettings />

            <Link
              href="https://github.com/Congmanh270504/nestjs-prisma-crud"
              target="_blank"
              className="ml-4 inline-flex gap-0.5 text-sm hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              View on GitHub
              <ArrowUpRight size={14} className="text-foreground" />
            </Link>
          </>
        ) : (
          <SidebarGroup className="p-2 group-data-[collapsible=icon]:p-0">
            {/* View khi mở rộng sidebar */}
            <div className="flex flex-col gap-3 rounded-xl border-sidebar-border bg-sidebar-accent/30 p-3.5 text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="size-4 shrink-0 text-amber-500" />
                <span>Try it now</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                You're currently using Calendar in <strong>mock data mode</strong>.
              </p>{" "}
              <p className="text-xs leading-relaxed text-muted-foreground">
                With mock data mode, you can move events by <strong>dragging and dropping</strong> them.
              </p>{" "}
            </div>

            {/* View thu nhỏ dạng icon */}
            <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:py-2">
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-amber-500 hover:bg-sidebar-accent hover:text-amber-600"
                  title="Đăng nhập để lưu lịch cá nhân"
                >
                  <Sparkles className="size-4" />
                </Button>
              </SignInButton>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        {!isLoaded ? (
          <div className="h-10 w-full animate-pulse rounded-md bg-sidebar-accent/50" />
        ) : isSignedIn ? (
          <NavUser user={currentUser} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs leading-relaxed text-muted-foreground">Sign in to unlock more features and manage your personal calendar.</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your information is sercured by{" "}
              <Link href="https://clerk.com" className="font-bold underline">
                Clerk
              </Link>
              . Don't worry about your personal information!
            </p>
            <Link
              href="https://github.com/Congmanh270504/nestjs-prisma-crud"
              target="_blank"
              className="inline-flex gap-0.5 text-sm hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              View on GitHub
              <ArrowUpRight size={14} className="text-foreground" />
            </Link>
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
              <SignInButton mode="modal">
                <button
                  className="flex h-9 w-full flex-1 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
                  title="Sign In"
                  onClick={isMobile ? toggleSidebar : undefined}
                >
                  <LogIn className="hidden size-4 group-data-[collapsible=icon]:block" />
                  <span className="group-data-[collapsible=icon]:hidden">Sign In</span>
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  className="h-9 w-full flex-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 group-data-[collapsible=icon]:hidden"
                  onClick={isMobile ? toggleSidebar : undefined}
                >
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
