"use client";

import * as React from "react";
import { AudioWaveform, BookOpen, Bot, Command, Frame, GalleryVerticalEnd, LogIn, Map, PieChart, Settings2, SquareTerminal, UserPlus } from "lucide-react";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import CalendarSettings from "@/calendar/components/dialogs/calendar-settings";
import { AddFriendsDialog } from "@/calendar/components/dialogs/add-friends-dialog";

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
  navMain: [
    {
      title: "Groups",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isSignedIn, isLoaded, user } = useUser();

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
        <NavMain items={data.navMain} />
        <CalendarSettings />
        <AddFriendsDialog>
          <Button variant="ghost" className="w-full justify-start gap-2 text-left">
            <UserPlus className="size-4" />
            <span>Invitations</span>
          </Button>
        </AddFriendsDialog>
      </SidebarContent>
      <SidebarFooter>
        {!isLoaded ? (
          <div className="h-10 w-full animate-pulse rounded-md bg-sidebar-accent/50" />
        ) : isSignedIn ? (
          <NavUser user={currentUser} />
        ) : (
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
            <SignInButton mode="modal">
              <button
                className="flex h-9 w-full flex-1 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
                title="Sign In"
              >
                <LogIn className="hidden size-4 group-data-[collapsible=icon]:block" />
                <span className="group-data-[collapsible=icon]:hidden">Sign In</span>
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="h-9 w-full flex-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 group-data-[collapsible=icon]:hidden">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
