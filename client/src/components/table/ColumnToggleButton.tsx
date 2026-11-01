"use client";

import { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export interface ColumnOption<T extends string> {
    key: T;
    label: string;
}

interface Props<T extends string> {
    visibleColumns: T[];
    onChange: (cols: T[]) => void;
    columns: ColumnOption<T>[];
    icon?: ReactNode;
    title?: string;
    align?: "start" | "center" | "end";
}

export default function ColumnToggleButton<T extends string>({
    visibleColumns,
    onChange,
    columns,
    icon = <SlidersHorizontal className="w-4 h-4" />,
    title = "Hiển thị cột",
    align = "end",
}: Props<T>) {
    const toggle = (key: T) => {
        if (visibleColumns.includes(key)) {
            // Keep at least one column visible to avoid empty tables
            if (visibleColumns.length > 1) {
                onChange(visibleColumns.filter((c) => c !== key));
            }
        } else {
            onChange([...visibleColumns, key]);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title={title}>
                    {icon}
                </Button>
            </PopoverTrigger>
            <PopoverContent align={align} className="w-52 p-3">
                <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-2">
                    {title}
                </p>
                <div className="space-y-1">
                    {columns.map((col) => {
                        const isVisible = visibleColumns.includes(col.key);
                        return (
                            <Label
                                key={col.key}
                                className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors font-normal"
                            >
                                <Checkbox
                                    checked={isVisible}
                                    onCheckedChange={() => toggle(col.key)}
                                />
                                <span className={`text-sm ${isVisible ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                    {col.label}
                                </span>
                            </Label>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
