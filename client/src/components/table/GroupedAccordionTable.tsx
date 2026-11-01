"use client";

import * as React from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/table/Pagination";
import { cn } from "@/lib/utils";

export type GroupedSection<TData> = {
    key: string;
    label: React.ReactNode;
    items: TData[];
};

export interface GroupedAccordionTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    groups: GroupedSection<TData>[];
    onRowClick?: (rowData: TData) => void;
    activeRowId?: string | null;
    emptyMessage?: string;
    tableHeaderClassName?: string;
    rowClassName?: string | ((rowData: TData, index: number) => string);
    activeRowClassName?: string;
    pagination?: {
        total: number;
        page: number;
        limit: number;
    };
    renderRowExpansion?: (rowData: TData) => React.ReactNode;
    defaultOpenAll?: boolean;
    striped?: boolean;
    badgeLabel?: string | ((count: number) => string);
}

function GroupedSubTable<TData, TValue>({
    columns,
    data,
    onRowClick,
    activeRowId,
    emptyMessage,
    tableHeaderClassName,
    rowClassName,
    activeRowClassName,
    renderRowExpansion,
    striped = true,
}: {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onRowClick?: (rowData: TData) => void;
    activeRowId?: string | null;
    emptyMessage: string;
    tableHeaderClassName: string;
    rowClassName?: string | ((rowData: TData, index: number) => string);
    activeRowClassName: string;
    renderRowExpansion?: (rowData: TData) => React.ReactNode;
    striped?: boolean;
}) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row: any, index) => row.id ?? row.ID ?? `${index}`,
    });

    const shouldIgnoreRowClick = (
        event: React.MouseEvent<HTMLTableRowElement>,
    ) => {
        const target = event.target as HTMLElement;
        return !!target.closest(
            "button, [role='checkbox'], input, a, svg, [data-no-row-open='true'], [role='menuitem'], [data-radix-collection-item]",
        );
    };

    return (
        <div className="rounded-lg border border-border bg-card overflow-x-auto shadow-2xs">
            <Table>
                <TableHeader className={tableHeaderClassName}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                            key={headerGroup.id}
                            className="border-border hover:bg-transparent"
                        >
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    className="font-semibold text-muted-foreground text-xs"
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext(),
                                          )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row, index) => {
                            const rowId =
                                (row.original as any)?.id ??
                                (row.original as any)?.ID;
                            const isActive =
                                Boolean(activeRowId) && rowId === activeRowId;
                            const expansion = renderRowExpansion?.(row.original);
                            const isEven = index % 2 === 1;

                            return (
                                <React.Fragment key={row.id}>
                                    <TableRow
                                        className={cn(
                                            "border-b border-border/60 transition-colors",
                                            striped && (isEven
                                                ? "bg-blue-50/40 dark:bg-blue-950/20"
                                                : "bg-card dark:bg-transparent"),
                                            isActive
                                                ? activeRowClassName
                                                : "hover:bg-blue-100/30 dark:hover:bg-blue-900/25",
                                            onRowClick && "cursor-pointer",
                                            typeof rowClassName === "function"
                                                ? rowClassName(row.original, index)
                                                : rowClassName,
                                        )}
                                        onClick={(event) => {
                                            if (!onRowClick) return;
                                            if (shouldIgnoreRowClick(event)) return;
                                            onRowClick(row.original);
                                        }}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {expansion && (
                                        <TableRow className="border-border bg-muted/20 hover:bg-muted/20">
                                            <TableCell
                                                colSpan={columns.length}
                                                className="p-0"
                                            >
                                                {expansion}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-20 text-center text-muted-foreground"
                            >
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export function GroupedAccordionTable<TData, TValue>({
    columns,
    groups,
    onRowClick,
    activeRowId,
    emptyMessage = "Không có dữ liệu",
    tableHeaderClassName = "bg-muted/50 dark:bg-muted/20",
    rowClassName,
    activeRowClassName = "bg-blue-100/60 dark:bg-blue-900/30 font-medium",
    pagination,
    renderRowExpansion,
    defaultOpenAll = true,
    striped = true,
    badgeLabel,
}: GroupedAccordionTableProps<TData, TValue>) {
    if (groups.length === 0) {
        return (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    const defaultValue = defaultOpenAll
        ? groups.map((g) => g.key)
        : (groups[0]?.key ? [groups[0].key] : []);
    const totalPages = pagination
        ? Math.ceil(pagination.total / pagination.limit)
        : 0;

    return (
        <div className="flex flex-col gap-3">
            <Accordion
                type="multiple"
                defaultValue={defaultValue}
                className="w-full space-y-3"
            >
                {groups.map((group) => (
                    <AccordionItem
                        key={group.key}
                        value={group.key}
                        className="overflow-hidden rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-card px-1 shadow-xs"
                    >
                        <AccordionTrigger className="rounded-lg px-3 py-2.5 hover:no-underline items-center hover:bg-muted/30 transition-colors">
                            <div className="flex w-full items-center justify-between px-2 py-1 pr-2">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    {group.label}
                                </div>
                                <Badge
                                    variant="outline"
                                    className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300"
                                >
                                    {typeof badgeLabel === "function"
                                        ? badgeLabel(group.items.length)
                                        : badgeLabel
                                          ? `${group.items.length} ${badgeLabel}`
                                          : `${group.items.length} định mức`}
                                </Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-3 pt-1">
                            <GroupedSubTable
                                columns={columns}
                                data={group.items}
                                onRowClick={onRowClick}
                                activeRowId={activeRowId}
                                emptyMessage={emptyMessage}
                                tableHeaderClassName={tableHeaderClassName}
                                rowClassName={rowClassName}
                                activeRowClassName={activeRowClassName}
                                renderRowExpansion={renderRowExpansion}
                                striped={striped}
                            />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {pagination && totalPages > 0 && (
                <div className="px-2 py-2 border-t border-border/60">
                    <Pagination
                        totalPages={totalPages}
                        currentPage={pagination.page}
                        total={pagination.total}
                        limit={pagination.limit}
                    />
                </div>
            )}
        </div>
    );
}
