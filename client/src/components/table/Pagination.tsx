"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    totalPages: number;
    currentPage: number;
    total: number;
    limit?: number;
    unit?: string;
}

export default function Pagination({
    totalPages,
    currentPage,
    total,
    limit,
    unit = "bản ghi",
}: Props) {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const pathname = usePathname();

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        if (limit) {
            params.set("limit", limit.toString());
        }
        replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Smart ellipsis pages
    const getPages = (): (number | "...")[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: (number | "...")[] = [];
        pages.push(1);
        if (currentPage > 3) pages.push("...");
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);
        return pages;
    };

    if (totalPages <= 1) {
        return (
            <span className="ml-auto text-xs text-muted-foreground">
                Tổng cộng:{" "}
                <span className="font-semibold text-foreground">{total}</span>{" "}
                {unit}
            </span>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
            <span className="text-xs text-muted-foreground">
                Trang{" "}
                <span className="font-semibold text-foreground">
                    {currentPage}
                </span>{" "}
                /{" "}
                <span className="font-semibold text-foreground">
                    {totalPages}
                </span>
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 text-muted-foreground"
                    aria-label="Trang trước"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                    {getPages().map((p, idx) =>
                        p === "..." ? (
                            <span
                                key={`el-${idx}`}
                                className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground select-none"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => goToPage(p as number)}
                                className={cn(
                                    "h-8 min-w-8 px-2 text-xs font-medium rounded-md transition-all active:scale-95",
                                    currentPage === p
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "border border-border bg-background hover:bg-muted text-foreground",
                                )}
                            >
                                {p}
                            </button>
                        ),
                    )}
                </div>

                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 text-muted-foreground"
                    aria-label="Trang sau"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
