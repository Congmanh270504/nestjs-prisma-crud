import "@/styles/globals.css";

import { Analytics } from "@vercel/analytics/react";

import { inter } from "@/styles/fonts";

import { cn } from "@/lib/utils";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { getEvents, getUsers } from "@/calendar/requests";

import { getTheme } from "@/cookies/get";

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Big Calendar by lramos33",
  description:
    "A feature-rich calendar application built with Next.js, TypeScript, and Tailwind CSS. This project provides a modern, responsive interface for managing events and schedules with multiple viewing options.",
};

import { ClerkSyncUser } from "@/components/auth/clerk-sync-user";
import { ClerkProvider } from "@clerk/nextjs";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const [events, users] = await Promise.all([getEvents(), getUsers()]);
  const theme = getTheme();

  return (
    <html lang="en-US" className={cn(inter.variable, theme)}>
      <body>
        <ClerkProvider>
          <ClerkSyncUser />
          <CalendarProvider users={users} events={events}>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                {/* <Header /> */}
                <div className="">
                  <Analytics />
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
          </CalendarProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
