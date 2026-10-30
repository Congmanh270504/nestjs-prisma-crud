import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, Calendar } from "lucide-react";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

import { ToggleTheme } from "@/components/layout/change-theme";
import CalendarSettings from "@/calendar/components/dialogs/calendar-settings";

export function Header() {
  return (
    <header className="mx-auto flex h-[88px] w-full max-w-screen-2xl items-center justify-center">
      <div className="my-3 flex h-14 w-full items-center justify-between px-8">
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 items-center justify-center rounded-full border p-3">
            <Calendar className="size-6 text-foreground" />
          </div>

          <div className="space-y-1">
            <p className="text-lg font-medium leading-6">Big calendar</p>
            <p className="text-sm text-foreground">
              Built with Next.js and Tailwind by{" "}
              <Link
                href="https://github.com/lramos33"
                target="_blank"
                className="inline-flex gap-0.5 text-sm underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                lramos33
                <ArrowUpRight size={12} className="text-foreground" />
              </Link>
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="https://github.com/lramos33/big-calendar"
            target="_blank"
            className="inline-flex gap-0.5 text-sm hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            View on GitHub
            <ArrowUpRight size={14} className="text-foreground" />
          </Link>

          <div className="flex items-center gap-2">
            <CalendarSettings />

            <ToggleTheme />

            <Suspense fallback={null}>
              <Show when="signed-out">
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <button className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
