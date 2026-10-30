"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface FramedDialogColors {
  /** Outer frame border color */
  border?: string;
  /** Thin inner frame border color */
  innerBorder?: string;
  /** Accent color (close button, default footer button) */
  accent?: string;
  /** Accent color on hover */
  accentHover?: string;
  /** Dialog background */
  background?: string;
  /** Default text color */
  text?: string;
}

export interface FramedDialogProps {
  /** Element that opens the dialog (rendered with `asChild`) */
  trigger?: React.ReactNode;
  /** Dialog body */
  children: React.ReactNode;
  /**
   * Custom footer. Pass `null` to hide the footer entirely.
   * If omitted, a default "DONE" close button is rendered.
   */
  footer?: React.ReactNode | null;
  /** Label of the default footer button */
  doneLabel?: string;
  /** Accessible title (visually hidden) */
  title?: string;
  /** Frame colors, any valid CSS color */
  colors?: FramedDialogColors;
  /** Hide the circular close button at the top-right corner */
  hideCloseButton?: boolean;
  /** Controlled state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Extra classes for the outer dialog frame (e.g. max-width, rounded) */
  className?: string;
  /** Extra classes for the inner padded container */
  innerClassName?: string;
}

const DEFAULT_COLORS: Required<FramedDialogColors> = {
  border: "#785a28",
  innerBorder: "rgba(200,170,110,0.3)",
  accent: "#c8aa6e",
  accentHover: "#f0e6d2",
  background: "#010a13",
  text: "#f0e6d2",
};

export function FramedDialog({
  trigger,
  children,
  footer,
  doneLabel = "DONE",
  title = "Dialog",
  colors,
  hideCloseButton = false,
  open,
  onOpenChange,
  className,
  innerClassName,
}: FramedDialogProps) {
  const c = { ...DEFAULT_COLORS, ...colors };

  const style = {
    "--fd-border": c.border,
    "--fd-inner-border": c.innerBorder,
    "--fd-accent": c.accent,
    "--fd-accent-hover": c.accentHover,
    "--fd-bg": c.background,
    "--fd-text": c.text,
  } as React.CSSProperties;

  const defaultFooter = (
    <DialogClose asChild>
      <button
        type="button"
        className="min-w-[130px] border-2 border-[color:var(--fd-accent)] bg-gradient-to-b from-[#1e2328] via-[#1a1e22] to-[#111417] px-8 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--fd-accent)] transition-all hover:border-[color:var(--fd-accent-hover)] hover:text-[color:var(--fd-accent-hover)] hover:brightness-110 active:scale-95"
      >
        {doneLabel}
      </button>
    </DialogClose>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        style={style}
        className={cn(
          "w-[95vw] max-w-[640px] rounded-lg border-2 border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] p-0 text-[color:var(--fd-text)] shadow-[0_0_50px_rgba(0,0,0,0.95)] outline-none [&>button:last-child]:hidden",
          className
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <div className={cn("relative border border-[color:var(--fd-inner-border)] p-6 sm:p-8", innerClassName)}>
          {!hideCloseButton && (
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute -right-3 -top-3 flex size-7 items-center justify-center rounded-full border-2 border-[color:var(--fd-accent)] bg-[color:var(--fd-bg)] text-[color:var(--fd-accent)] shadow-[0_0_10px_rgba(0,0,0,0.8)] transition-all hover:border-[color:var(--fd-accent-hover)] hover:text-[color:var(--fd-accent-hover)] focus:outline-none"
              >
                <X className="size-4 stroke-[2.5]" />
              </button>
            </DialogClose>
          )}

          {children}

          {footer !== null && <div className="mt-8 flex justify-center">{footer === undefined ? defaultFooter : footer}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FramedDialog;
