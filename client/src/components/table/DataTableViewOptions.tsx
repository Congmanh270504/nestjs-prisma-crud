"use client";

import { Settings2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

export interface DataTableViewOption {
    id: string;
    label: string;
    isActive: boolean;
}

interface DataTableViewOptionsProps {
    columns: DataTableViewOption[];
    onChange: (id: string, isActive: boolean) => void;
}

export function DataTableViewOptions({
    columns,
    onChange,
}: DataTableViewOptionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto h-8 ">
                    <Settings2 />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-45">
                <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.isActive}
                        onCheckedChange={(value) =>
                            onChange(column.id, !!value)
                        }
                        onSelect={(event) => event.preventDefault()}
                    >
                        {column.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
