import "@/styles/globals.css";

import { Analytics } from "@vercel/analytics/react";

import { inter } from "@/styles/fonts";

import { cn } from "@/lib/utils";

import { Header } from "@/components/layout/header";
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

export default async function Layout({ children }: { children: React.ReactNode }) {
  const [events, users] = await Promise.all([getEvents(), getUsers()]);
  const theme = getTheme();

  return (
    <html lang="en-US" className={cn(inter.variable, theme)}>
      <body>
        <CalendarProvider users={users} events={events}>
          <Header />
          <Analytics />
          {children}
        </CalendarProvider>
      </body>
    </html>
  );
}
