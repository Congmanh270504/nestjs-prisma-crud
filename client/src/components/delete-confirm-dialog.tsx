"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "./ui/spinner";

type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isDeleting: boolean;
  actionText: string;
  title: string;
  description: React.ReactNode;
  onCancel?: () => void;
  cancelText?: string;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  actionText,
  title,
  description,
  onCancel,
  cancelText = "Hủy",
}: DeleteConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (isDeleting && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        onEscapeKeyDown={event => {
          if (isDeleting) event.preventDefault();
        }}
        onPointerDownOutside={event => {
          if (isDeleting) event.preventDefault();
        }}
        className="sm:max-w-120 gap-0 rounded-lg p-0"
      >
        <DialogHeader className="bg-linear-to-r rounded-t-lg from-red-500 to-rose-600 px-4 py-3">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-base">{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="px-6 py-4">
          <Button
            variant="outline"
            onClick={() => {
              if (isDeleting) return;
              onOpenChange(false);
              onCancel?.();
            }}
            disabled={isDeleting}
          >
            {cancelText}
          </Button>
          <Button onClick={onConfirm} disabled={isDeleting} variant="destructive" className="ml-2 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500">
            {isDeleting ? <Spinner /> : actionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
