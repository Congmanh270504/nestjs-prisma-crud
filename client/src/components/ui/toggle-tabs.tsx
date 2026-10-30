"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ToggleTabItem {
  label: React.ReactNode;
  value: string;
  ariaLabel?: string;
  title?: string;
}

interface ToggleTabsProps {
  items: ToggleTabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  fullWidth?: boolean;
}

export function ToggleTabs({ items, value, onChange, className, fullWidth }: ToggleTabsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverStyle, setHoverStyle] = useState<React.CSSProperties>({});
  const [activeStyle, setActiveStyle] = useState<React.CSSProperties>({ left: "0px", width: "0px" });
  const activeIdx = items.findIndex(item => item.value === value);

  const updateActiveIndicator = React.useCallback(() => {
    const el = tabRefs.current[activeIdx];
    if (el) setActiveStyle({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeIdx]);

  useEffect(() => {
    if (hoverIdx !== null) {
      const el = tabRefs.current[hoverIdx];
      if (el) setHoverStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [hoverIdx]);

  useEffect(() => {
    updateActiveIndicator();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      updateActiveIndicator();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateActiveIndicator]);

  const handleMouseEnter = (idx: number) => {
    setHoverIdx(idx);
    const el = tabRefs.current[idx];
    if (el) setHoverStyle({ left: el.offsetLeft, width: el.offsetWidth });
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative flex shrink-0 items-center rounded-lg border border-border/50 bg-muted/80 p-0.5", fullWidth && "w-full", className)}
    >
      {/* Hover highlight */}
      <div
        className="pointer-events-none absolute top-0.5 h-[calc(100%-4px)] rounded-md bg-foreground/10 shadow-sm transition-all duration-300 ease-out dark:bg-foreground/15"
        style={{ ...hoverStyle, opacity: hoverIdx !== null ? 1 : 0 }}
      />
      {/* Active underline */}
      <div className="pointer-events-none absolute bottom-0 h-0.5 bg-indigo-600 transition-all duration-300 ease-out dark:bg-indigo-400" style={activeStyle} />
      {items.map((item, idx) => (
        <button
          key={item.value}
          type="button"
          aria-label={item.ariaLabel}
          title={item.title}
          ref={el => {
            tabRefs.current[idx] = el;
          }}
          className={cn(
            "relative z-10 flex h-full items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors duration-300 sm:px-3",
            fullWidth && "flex-1",
            value === item.value ? "font-semibold text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onChange(item.value)}
          onMouseEnter={() => handleMouseEnter(idx)}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
