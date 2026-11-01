"use client"
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    totalPages: number;
    currentPage: number;
    total: number;
    onPageChange: (page: number) => void;
}

export default function StatePagination({ totalPages, currentPage, total, onPageChange }: Props) {
    // Smart ellipsis pages
    const getPages = (): (number | '...')[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: (number | '...')[] = [];
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    if (totalPages <= 1) {
        return (
            <span className="ml-auto text-xs text-muted-foreground italic">
                Tổng cộng: <span className="font-bold text-foreground">{total}</span> bản ghi
            </span>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <span className="text-xs text-muted-foreground font-medium">
                Trang{' '}
                <span className="font-bold text-primary">{currentPage}</span>
                {' '}/ <span className="font-bold text-slate-700">{totalPages}</span>
                <span className="ml-1 text-[11px] italic">({total} bản ghi)</span>
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 text-muted-foreground shadow-xs"
                    aria-label="Trang trước"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                    {getPages().map((p, idx) =>
                        p === '...' ? (
                            <span
                                key={`el-${idx}`}
                                className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground select-none"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onPageChange(p as number)}
                                className={cn(
                                    "h-8 min-w-8 px-2 text-xs font-bold rounded-lg transition-all active:scale-95 shadow-xs border",
                                    currentPage === p
                                        ? "bg-primary text-white border-primary"
                                        : "border-border bg-white hover:bg-slate-50 text-slate-600"
                                )}
                            >
                                {p}
                            </button>
                        )
                    )}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 text-muted-foreground shadow-xs"
                    aria-label="Trang sau"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
