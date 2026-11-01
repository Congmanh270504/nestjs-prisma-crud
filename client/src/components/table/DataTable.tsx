"use client";

import {
    ColumnDef,
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    RowSelectionState,
    SortingState,
    type Table as ReactTableInstance,
    useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { Suspense } from "react";
import { type MouseEvent, useState } from "react";

import Pagination from "@/components/table/Pagination";
import StatePagination from "@/components/table/StatePagination";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

type PaginationConfig = {
    total: number;
    page: number;
    limit: number;
    onPageChange?: (page: number) => void;
};

type DataTableButtonAction = Omit<
    React.ComponentProps<typeof Button>,
    "children"
> & {
    label: React.ReactNode;
    icon?: React.ReactNode;
    key?: React.Key;
};

type DataTableAction = DataTableButtonAction | React.ReactNode;

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    emptyMessage?: string;
    meta?: any;
    pagination?: PaginationConfig;
    onRowClick?: (row: TData) => void;
    rowClassName?: string | ((row: TData) => string);
    getRowId?: (originalRow: TData, index: number, parent?: any) => string;
    stickyColumns?: string[];
    stickyHeaderClassName?: string;
    stickyCellClassName?: string;
    enableSearch?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    searchDebounceMs?: number;
    actions?: DataTableAction[];
    renderToolbarActions?: (
        table: ReactTableInstance<TData>,
    ) => React.ReactNode;
    viewMode?: "table" | "card";
    cardView?: (table: ReactTableInstance<TData>) => React.ReactNode;
    renderRowExpansion?: (row: TData) => React.ReactNode;
    enableRowSelection?: boolean;
    hideDataArea?: boolean;
    clientPagination?: boolean;
    initialPageSize?: number;
    pageSizeOptions?: number[];
    hideToolbar?: boolean;
    tableClassName?: string;
    renderTableFooter?: (table: ReactTableInstance<TData>) => React.ReactNode;
    tableFooter?: React.ReactNode;
}

function isDataTableButtonAction(
    action: DataTableAction,
): action is DataTableButtonAction {
    return (
        !!action &&
        typeof action === "object" &&
        !React.isValidElement(action) &&
        "label" in action
    );
}

const normalizeSearchValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (Array.isArray(value)) {
        return value.map(normalizeSearchValue).join(" ");
    }

    if (typeof value === "object") {
        return Object.values(value).map(normalizeSearchValue).join(" ");
    }

    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
};

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
    return (
        <Suspense fallback={null}>
            <DataTableContent {...props} />
        </Suspense>
    );
}

function DataTableContent<TData, TValue>({
    columns,
    data,
    emptyMessage = "Chưa có dữ liệu",
    meta,
    pagination,
    onRowClick,
    rowClassName,
    getRowId,
    stickyColumns,
    stickyHeaderClassName,
    stickyCellClassName,
    enableSearch = true,
    searchValue,
    onSearchChange,
    searchPlaceholder = "Tìm kiếm...",
    searchDebounceMs = 0,
    actions = [],
    renderToolbarActions,
    viewMode = "table",
    cardView,
    renderRowExpansion,
    enableRowSelection = false,
    hideDataArea = false,
    clientPagination = false,
    initialPageSize = 20,
    pageSizeOptions = [20, 30, 40, 50, 100],
    hideToolbar = false,
    tableClassName,
    renderTableFooter,
    tableFooter,
}: DataTableProps<TData, TValue>) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [searchInputValue, setSearchInputValue] = useState(
        searchValue ?? globalFilter,
    );
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [clientPaginationState, setClientPaginationState] =
        useState<PaginationState>({
            pageIndex: 0,
            pageSize: initialPageSize,
        });
    const isControlledSearch = searchValue !== undefined;
    const enableClientGlobalFilter = !isControlledSearch;

    const globalFilterFn = React.useCallback<FilterFn<TData>>(
        (row, _columnId, filterValue) => {
            const query = normalizeSearchValue(filterValue);

            if (!query) return true;

            return normalizeSearchValue(row.original).includes(query);
        },
        [],
    );

    const tableGlobalFilter = searchValue ?? globalFilter;
    const handleGlobalFilterChange = React.useCallback(
        (updaterOrValue: string | ((old: string) => string)) => {
            const nextValue =
                typeof updaterOrValue === "function"
                    ? updaterOrValue(tableGlobalFilter)
                    : updaterOrValue;

            if (searchValue === undefined) {
                setGlobalFilter(nextValue);
            }

            onSearchChange?.(nextValue);

            if (clientPagination) {
                setClientPaginationState((current) =>
                    current.pageIndex === 0
                        ? current
                        : { ...current, pageIndex: 0 },
                );
            }
        },
        [clientPagination, onSearchChange, searchValue, tableGlobalFilter],
    );

    React.useEffect(() => {
        setSearchInputValue(searchValue ?? globalFilter);
    }, [globalFilter, searchValue]);

    React.useEffect(() => {
        if (searchDebounceMs <= 0) return;
        if (searchInputValue === tableGlobalFilter) return;

        const timeoutId = window.setTimeout(() => {
            handleGlobalFilterChange(searchInputValue);
        }, searchDebounceMs);

        return () => window.clearTimeout(timeoutId);
    }, [
        handleGlobalFilterChange,
        searchDebounceMs,
        searchInputValue,
        tableGlobalFilter,
    ]);

    React.useEffect(() => {
        if (!clientPagination) return;

        setClientPaginationState((current) =>
            current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
        );
    }, [clientPagination, data, tableGlobalFilter]);

    React.useEffect(() => {
        if (!enableRowSelection) return;

        setRowSelection({});
    }, [data, enableRowSelection]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: enableClientGlobalFilter
            ? getFilteredRowModel()
            : undefined,
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: clientPagination
            ? getPaginationRowModel()
            : undefined,
        onSortingChange: setSorting,
        onGlobalFilterChange: handleGlobalFilterChange,
        onPaginationChange: clientPagination
            ? setClientPaginationState
            : undefined,
        onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
        globalFilterFn: enableClientGlobalFilter ? globalFilterFn : undefined,
        enableRowSelection,
        state: {
            sorting,
            ...(enableClientGlobalFilter
                ? { globalFilter: tableGlobalFilter }
                : {}),
            ...(clientPagination ? { pagination: clientPaginationState } : {}),
            ...(enableRowSelection ? { rowSelection } : {}),
        },
        meta,
        getRowId,
    });

    const stickySet = new Set(stickyColumns ?? []);
    const stickyClampClass = "max-w-[200px] sm:max-w-none truncate";

    const metaPagination = meta as PaginationConfig | undefined;
    const paginationConfig = pagination ?? metaPagination;
    const total = paginationConfig?.total ?? 0;
    const page = paginationConfig?.page ?? 1;
    const rawLimit = paginationConfig?.limit ?? initialPageSize;
    const limit = pageSizeOptions.includes(rawLimit)
        ? rawLimit
        : (pageSizeOptions[0] ?? 20);
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    const clientTotal = table.getFilteredRowModel().rows.length;
    const clientTotalPages = table.getPageCount();
    const currentPage = clientPaginationState.pageIndex + 1;

    const handleLimitChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        params.set("limit", value);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const shouldIgnoreRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
        const target = event.target as HTMLElement;
        return !!target.closest(
            "button, input, textarea, a, svg, [role='checkbox'], [role='menuitem'], [data-no-row-open='true'], [data-radix-collection-item]",
        );
    };

    return (
        <>
            {!hideToolbar ? (
                <div className="flex min-w-0 flex-col gap-2 p-2 md:flex-row md:items-center md:justify-between ">
                    {enableSearch ? (
                        <div className="relative w-full max-w-md flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchInputValue}
                                placeholder={searchPlaceholder}
                                className="pl-9"
                                onChange={(event) => {
                                    const nextValue = event.target.value;
                                    setSearchInputValue(nextValue);
                                    if (searchDebounceMs <= 0) {
                                        handleGlobalFilterChange(nextValue);
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div />
                    )}
                    <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
                        {actions.map((action, index) => {
                            if (isDataTableButtonAction(action)) {
                                const { label, icon, key, ...buttonProps } =
                                    action;

                                return (
                                    <Button
                                        key={key ?? `action-${index}`}
                                        type="button"
                                        {...buttonProps}
                                    >
                                        {icon}
                                        {label}
                                    </Button>
                                );
                            }

                            return (
                                <React.Fragment key={`action-${index}`}>
                                    {action}
                                </React.Fragment>
                            );
                        })}
                        {renderToolbarActions?.(table)}
                    </div>
                </div>
            ) : null}
            <div className="w-full min-w-0 max-w-full overflow-x-auto">
                {!hideDataArea && viewMode === "card" && cardView ? (
                    <div className="md:hidden">{cardView(table)}</div>
                ) : null}
                {!hideDataArea ? (
                    <div
                        className={cn(
                            viewMode === "card" && cardView
                                ? "hidden md:block"
                                : "",
                        )}
                    >
                        <Table className={cn("min-w-full", tableClassName)}>
                            <TableHeader
                                className="sticky top-0 z-20"
                                // style={{ backgroundColor: "#C4E2F5" }}
                            >
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        // className="border-b border-[#4BB8FA] hover:bg-[#4BB8FA]/20"
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className={cn(
                                                    stickySet.has(
                                                        header.column.id,
                                                    )
                                                        ? cn(
                                                              "sticky left-0 z-30 backdrop-blur-3xl border-b border-border after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border/60",
                                                              stickyClampClass,
                                                              stickyHeaderClassName,
                                                          )
                                                        : undefined,
                                                    "font-semibold text-gray-700 dark:text-slate-200",
                                                )}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => {
                                        const expansion = renderRowExpansion?.(
                                            row.original,
                                        );

                                        return (
                                            <React.Fragment key={row.id}>
                                                <TableRow
                                                    data-state={
                                                        row.getIsSelected() &&
                                                        "selected"
                                                    }
                                                    onClick={
                                                        onRowClick
                                                            ? (event) => {
                                                                  if (
                                                                      shouldIgnoreRowClick(
                                                                          event,
                                                                      )
                                                                  ) {
                                                                      return;
                                                                  }
                                                                  onRowClick(
                                                                      row.original,
                                                                  );
                                                              }
                                                            : undefined
                                                    }
                                                    className={cn(
                                                        onRowClick
                                                            ? "cursor-pointer"
                                                            : undefined,
                                                        "border-gray-100 dark:border-white/5 odd:bg-white dark:odd:bg-transparent even:bg-[#F0F4F8] dark:even:bg-white/[0.03] hover:bg-[#e8eef4] dark:hover:bg-white/[0.06]",
                                                        typeof rowClassName ===
                                                            "function"
                                                            ? rowClassName(
                                                                  row.original,
                                                              )
                                                            : rowClassName,
                                                    )}
                                                >
                                                    {row
                                                        .getVisibleCells()
                                                        .map((cell) => (
                                                            <TableCell
                                                                key={cell.id}
                                                                className={cn(
                                                                    stickySet.has(
                                                                        cell
                                                                            .column
                                                                            .id,
                                                                    )
                                                                        ? cn(
                                                                              "sticky left-0 z-30 backdrop-blur-3xl border-b border-border after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border/60",
                                                                              stickyClampClass,
                                                                              stickyCellClassName,
                                                                          )
                                                                        : undefined,
                                                                    "text-slate-800 dark:text-slate-200",
                                                                )}
                                                            >
                                                                {flexRender(
                                                                    cell.column
                                                                        .columnDef
                                                                        .cell,
                                                                    cell.getContext(),
                                                                )}
                                                            </TableCell>
                                                        ))}
                                                </TableRow>
                                                {expansion ? (
                                                    <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                        <TableCell
                                                            colSpan={
                                                                row.getVisibleCells()
                                                                    .length
                                                            }
                                                            className="p-3"
                                                        >
                                                            {expansion}
                                                        </TableCell>
                                                    </TableRow>
                                                ) : null}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center text-muted-foreground italic"
                                        >
                                            {emptyMessage}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            {(renderTableFooter || tableFooter) && (
                                <TableFooter className="sticky bottom-0 z-10 bg-[#C4E2F5]/80 font-bold border-t-2 border-[#4BB8FA]">
                                    {renderTableFooter
                                        ? renderTableFooter(table)
                                        : tableFooter}
                                </TableFooter>
                            )}
                        </Table>
                    </div>
                ) : null}
            </div>
            
            {paginationConfig && totalPages > 0 ? (
                <div className="mt-3 flex flex-col gap-3 px-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            Dòng/trang
                        </span>
                        <Select
                            value={String(limit)}
                            onValueChange={handleLimitChange}
                        >
                            <SelectTrigger className="h-8 w-20">
                                <SelectValue placeholder={String(limit)} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {pageSizeOptions.map((pageSize) => (
                                    <SelectItem
                                        key={pageSize}
                                        value={String(pageSize)}
                                    >
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {paginationConfig.onPageChange ? (
                        <StatePagination
                            totalPages={totalPages}
                            currentPage={page}
                            total={total}
                            onPageChange={paginationConfig.onPageChange}
                        />
                    ) : (
                        <Pagination
                            totalPages={totalPages}
                            currentPage={page}
                            total={total}
                            limit={limit}
                        />
                    )}
                </div>
            ) : null}
            {clientPagination && clientTotalPages > 0 ? (
                <div className="mt-3 flex flex-col gap-3 px-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            Dòng/trang
                        </span>
                        <Select
                            value={String(clientPaginationState.pageSize)}
                            onValueChange={(value) =>
                                table.setPageSize(Number(value))
                            }
                        >
                            <SelectTrigger className="h-8 w-20">
                                <SelectValue
                                    placeholder={String(
                                        clientPaginationState.pageSize,
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {pageSizeOptions.map((pageSize) => (
                                    <SelectItem
                                        key={pageSize}
                                        value={String(pageSize)}
                                    >
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <StatePagination
                        totalPages={clientTotalPages}
                        currentPage={currentPage}
                        total={clientTotal}
                        onPageChange={(nextPage) =>
                            table.setPageIndex(nextPage - 1)
                        }
                    />
                </div>
            ) : null}
        </>
    );
}
