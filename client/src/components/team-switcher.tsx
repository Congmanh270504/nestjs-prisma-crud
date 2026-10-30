"use client";

import { Calendar } from "lucide-react";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { ToggleTheme } from "./layout/change-theme";

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="hover:cursor-auto hover:bg-transparent active:bg-transparent data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Calendar className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Big calendar</span>
            <span className="truncate text-xs">Cmanh</span>
          </div>
          <ToggleTheme />
        </SidebarMenuButton>
        {/* <SidebarTrigger className="" /> */}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
