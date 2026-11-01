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
  const hasCustomBg = Boolean(colors?.background);
  const hasCustomBorder = Boolean(colors?.border);
  const hasCustomText = Boolean(colors?.text);
  const hasCustomInner = Boolean(colors?.innerBorder);
  const hasCustomAccent = Boolean(colors?.accent);

  const style = {
    ...(colors?.border ? { "--fd-border": colors.border } : {}),
    ...(colors?.innerBorder ? { "--fd-inner-border": colors.innerBorder } : {}),
    ...(colors?.accent ? { "--fd-accent": colors.accent } : {}),
    ...(colors?.accentHover ? { "--fd-accent-hover": colors.accentHover } : {}),
    ...(colors?.background ? { "--fd-bg": colors.background } : {}),
    ...(colors?.text ? { "--fd-text": colors.text } : {}),
  } as React.CSSProperties;

  const defaultFooter = (
    <DialogClose asChild>
      <button
        type="button"
        className={cn(
          "min-w-[130px] border-2 px-8 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-all active:scale-95",
          hasCustomAccent
            ? "border-[color:var(--fd-accent)] bg-gradient-to-b from-[#1e2328] via-[#1a1e22] to-[#111417] text-[color:var(--fd-accent)] hover:border-[color:var(--fd-accent-hover)] hover:text-[color:var(--fd-accent-hover)] hover:brightness-110"
            : "border-[#b38c4b] bg-gradient-to-b from-[#fdfbf7] via-[#f7f2e7] to-[#ebe1cc] text-[#785a28] shadow-[0_2px_10px_rgba(179,140,75,0.2)] hover:border-[#785a28] hover:text-[#5a431c] hover:brightness-105 dark:border-[#c8aa6e] dark:bg-gradient-to-b dark:from-[#1e2328] dark:via-[#1a1e22] dark:to-[#111417] dark:text-[#c8aa6e] dark:shadow-[0_0_12px_rgba(200,170,110,0.15)] dark:hover:border-[#f0e6d2] dark:hover:text-[#f0e6d2] dark:hover:brightness-110"
        )}
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
          "w-[95vw] max-w-[640px] rounded-lg border-2 p-0 outline-none [&>button:last-child]:hidden",
          hasCustomBorder ? "border-[color:var(--fd-border)]" : "border-[#c8aa6e] dark:border-[#785a28]",
          hasCustomBg ? "bg-[color:var(--fd-bg)]" : "bg-white dark:bg-[#010a13]",
          hasCustomText ? "text-[color:var(--fd-text)]" : "text-slate-900 dark:text-[#f0e6d2]",
          "shadow-[0_10px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_0_50px_rgba(0,0,0,0.95)]",
          className
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <div
          className={cn(
            "relative border p-6 sm:p-8",
            hasCustomInner ? "border-[color:var(--fd-inner-border)]" : "border-[#c8aa6e]/30 dark:border-[#c8aa6e]/30",
            innerClassName
          )}
        >
          {!hideCloseButton && (
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close"
                className={cn(
                  "absolute -right-3 -top-3 flex size-7 items-center justify-center rounded-full border-2 transition-all focus:outline-none",
                  hasCustomAccent
                    ? "border-[color:var(--fd-accent)] bg-[color:var(--fd-bg)] text-[color:var(--fd-accent)] hover:border-[color:var(--fd-accent-hover)] hover:text-[color:var(--fd-accent-hover)]"
                    : "border-[#b38c4b] bg-white text-[#9e7938] shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:border-[#785a28] hover:text-[#785a28] dark:border-[#c8aa6e] dark:bg-[#010a13] dark:text-[#c8aa6e] dark:shadow-[0_0_10px_rgba(0,0,0,0.8)] dark:hover:border-[#f0e6d2] dark:hover:text-[#f0e6d2]"
                )}
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
