"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { Users, Plus, Check, X, Pencil, Trash2, Loader2, FolderOpen } from "lucide-react";

import { FramedDialog } from "@/components/framed-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/table/DataTable";
import { getGroupsApi, createGroupApi, updateGroupApi, deleteGroupApi, type IGroup } from "@/calendar/requests";

interface ManageGroupsDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const COLOR_OPTIONS = [
  { value: "blue", label: "Blue", bg: "bg-blue-500" },
  { value: "green", label: "Green", bg: "bg-emerald-500" },
  { value: "red", label: "Red", bg: "bg-rose-500" },
  { value: "yellow", label: "Yellow", bg: "bg-amber-500" },
  { value: "purple", label: "Purple", bg: "bg-purple-500" },
  { value: "orange", label: "Orange", bg: "bg-orange-500" },
  { value: "gray", label: "Gray", bg: "bg-slate-500" },
];

const DEFAULT_NEW_ROW: IGroup = {
  id: "__new__",
  name: "",
  color: "blue",
  ownerId: "",
  isNew: true,
};

export function ManageGroupsDialog({ children, open: controlledOpen, onOpenChange: controlledOnOpenChange }: ManageGroupsDialogProps) {
  const { user, isLoaded, isSignedIn } = useUser();

  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;

  // 1) States theo đúng Skill Edited Table
  const [list, setList] = React.useState<IGroup[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [addingRow, setAddingRow] = React.useState(false);
  const [newRow, setNewRow] = React.useState<IGroup>(DEFAULT_NEW_ROW);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingRow, setEditingRow] = React.useState<IGroup>({
    id: "",
    name: "",
    color: "gray",
    ownerId: "",
  });

  // Fetch groups khi dialog mở ra
  const fetchGroups = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getGroupsApi({ clerkId: user.id });
      setList(data);
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách nhóm:", err);
      setError("Không thể tải danh sách nhóm. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    if (isOpen && isSignedIn && user?.id) {
      fetchGroups();
      setAddingRow(false);
      setEditingId(null);
      setError(null);
    }
  }, [isOpen, isSignedIn, user?.id, fetchGroups]);

  // 2) Handlers theo Skill Edited Table
  const handleTextChange = React.useCallback((value: string, field: "name", isEdit = false) => {
    const sanitized = value.trimStart();
    if (isEdit) {
      setEditingRow(prev => ({ ...prev, [field]: sanitized }));
      return;
    }
    setNewRow(prev => ({ ...prev, [field]: sanitized }));
  }, []);

  const handleColorChange = React.useCallback((color: string, isEdit = false) => {
    if (isEdit) {
      setEditingRow(prev => ({ ...prev, color }));
      return;
    }
    setNewRow(prev => ({ ...prev, color }));
  }, []);

  const handleStartAdd = React.useCallback(() => {
    setEditingId(null);
    setNewRow({
      id: "__new__",
      name: "",
      color: "blue",
      ownerId: user?.id || "",
      isNew: true,
    });
    setAddingRow(true);
    setError(null);
  }, [user?.id]);

  const handleCancelAdd = React.useCallback(() => {
    setAddingRow(false);
    setNewRow(DEFAULT_NEW_ROW);
    setError(null);
  }, []);

  const handleStartEdit = React.useCallback((item: IGroup) => {
    setAddingRow(false);
    setEditingId(item.id);
    setEditingRow(item);
    setError(null);
  }, []);

  const handleCancelEdit = React.useCallback(() => {
    setEditingId(null);
    setError(null);
  }, []);

  const handleCreate = React.useCallback(async () => {
    if (!newRow.name.trim()) {
      setError("Tên nhóm không được để trống!");
      return;
    }
    if (!user?.id) {
      setError("Bạn cần đăng nhập để tạo nhóm.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await createGroupApi({
        name: newRow.name.trim(),
        color: newRow.color || "blue",
        clerkId: user.id,
      });
      setList(prev => [created, ...prev]);
      setAddingRow(false);
      setNewRow(DEFAULT_NEW_ROW);
      window.dispatchEvent(new CustomEvent("groups-updated"));
    } catch (err: any) {
      console.error("Lỗi khi tạo nhóm:", err);
      setError(err?.message || "Không thể tạo nhóm mới.");
    } finally {
      setSubmitting(false);
    }
  }, [newRow, user?.id]);

  const handleUpdate = React.useCallback(
    async (id: string) => {
      if (!editingRow.name.trim()) {
        setError("Tên nhóm không được để trống!");
        return;
      }

      setSubmitting(true);
      setError(null);
      try {
        const updated = await updateGroupApi(id, {
          name: editingRow.name.trim(),
          color: editingRow.color || "gray",
        });
        setList(prev => prev.map(item => (item.id === id ? { ...item, ...updated } : item)));
        setEditingId(null);
        window.dispatchEvent(new CustomEvent("groups-updated"));
      } catch (err: any) {
        console.error("Lỗi khi cập nhật nhóm:", err);
        setError(err?.message || "Không thể cập nhật nhóm.");
      } finally {
        setSubmitting(false);
      }
    },
    [editingRow]
  );

  const handleDelete = React.useCallback(
    async (id: string) => {
      const isConfirm = window.confirm("Bạn có chắc chắn muốn xóa nhóm này không?");
      if (!isConfirm) return;

      setSubmitting(true);
      setError(null);
      try {
        await deleteGroupApi(id);
        setList(prev => prev.filter(item => item.id !== id));
        if (editingId === id) {
          setEditingId(null);
        }
        window.dispatchEvent(new CustomEvent("groups-updated"));
      } catch (err: any) {
        console.error("Lỗi khi xóa nhóm:", err);
        setError(err?.message || "Không thể xóa nhóm.");
      } finally {
        setSubmitting(false);
      }
    },
    [editingId]
  );

  // 3) Table data memoized (không mutate list gốc)
  const tableData = React.useMemo<IGroup[]>(() => {
    const rows = editingId ? list.map(item => (item.id === editingId ? editingRow : item)) : list;

    return addingRow ? [{ ...newRow, id: "__new__", isNew: true } as IGroup, ...rows] : rows;
  }, [addingRow, editingId, editingRow, list, newRow]);

  // Row ID ổn định để DataTable không re-render remount input
  const getRowId = React.useCallback((row: IGroup) => row.id, []);

  // 4) Columns memoized theo đúng Skill Edited Table
  const columns = React.useMemo<ColumnDef<IGroup, any>[]>(
    () => [
      {
        id: "index",
        header: () => <div className="text-center font-semibold"></div>,
        cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
      },
      {
        accessorKey: "name",
        header: () => <div className="text-left font-semibold">Name</div>,
        cell: ({ row }) => {
          const item = row.original;
          const isEditing = editingId === item.id;
          if (item.isNew || isEditing) {
            return (
              <Input
                autoFocus
                value={item.name}
                onChange={e => handleTextChange(e.target.value, "name", isEditing)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (item.isNew) handleCreate();
                    else handleUpdate(item.id);
                  } else if (e.key === "Escape") {
                    if (item.isNew) handleCancelAdd();
                    else handleCancelEdit();
                  }
                }}
                placeholder="Group names..."
                className="h-8 max-w-[280px] bg-white dark:border-[#785a28] dark:bg-[#091428]/90 dark:text-[#f0e6d2] dark:placeholder:text-[#5c5b57] dark:focus-visible:border-[#c8aa6e]"
              />
            );
          }

          const currentColor = COLOR_OPTIONS.find(c => c.value === item.color);

          return (
            <div className="flex items-center gap-2 font-medium">
              <span className={`size-2.5 rounded-full ${currentColor?.bg || "bg-slate-400"}`} />
              <span className="truncate">{item.name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "color",
        header: () => <div className="text-center font-semibold">Color</div>,
        cell: ({ row }) => {
          const item = row.original;
          const isEditing = editingId === item.id;
          const currentColor = COLOR_OPTIONS.find(c => c.value === item.color);

          if (item.isNew || isEditing) {
            return (
              <div className="flex justify-center">
                <Select value={item.color || "blue"} onValueChange={val => handleColorChange(val, isEditing)}>
                  <SelectTrigger className="h-8 w-[120px] bg-white dark:border-[#785a28] dark:bg-[#091428]/90 dark:text-[#f0e6d2]">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span className={`size-2.5 rounded-full ${currentColor?.bg || "bg-slate-400"}`} />
                        <span>{currentColor?.label || "Chọn"}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="dark:border-[#785a28] dark:bg-[#091428] dark:text-[#f0e6d2]">
                    {COLOR_OPTIONS.map(col => (
                      <SelectItem key={col.value} value={col.value}>
                        <div className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${col.bg}`} />
                          <span>{col.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-0.5 dark:border-[#785a28] dark:text-[#f0e6d2]">
                <span className={`size-2 rounded-full ${currentColor?.bg || "bg-slate-400"}`} />
                <span className="text-xs">{currentColor?.label || item.color || "gray"}</span>
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "invitations",
        header: () => <div className="text-center font-semibold">Members</div>,
        cell: ({ row }) => {
          const item = row.original;
          if (item.isNew) {
            return <div className="text-center text-xs text-muted-foreground dark:text-[#a09b8c]">-</div>;
          }
          const count = item._count?.invitations ?? 0;
          return (
            <div className="text-center">
              <Badge variant="secondary" className="text-xs dark:border dark:border-[#785a28]/50 dark:bg-[#1e2328] dark:text-[#c8aa6e]">
                {count} {count <= 1 ? "member" : "members"}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: () => <div className="text-center font-semibold">Created</div>,
        cell: ({ row }) => {
          const item = row.original;
          if (item.isNew || !item.createdAt) {
            return <div className="text-center text-xs text-muted-foreground dark:text-[#a09b8c]">Today</div>;
          }
          return <div className="text-center text-xs text-muted-foreground dark:text-[#a09b8c]">{format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")}</div>;
        },
      },
      {
        id: "actions",
        header: () => (
          <div className=" text-center font-semibold">
            <Button
              size="sm"
              onClick={handleStartAdd}
              disabled={addingRow || submitting || !isSignedIn || (editingId ? true : false)}
              className="gap-1.5 text-xs shadow-sm dark:border dark:border-[#785a28] dark:bg-[#1e2328] dark:text-[#c8aa6e] dark:hover:border-[#c8aa6e] dark:hover:bg-[#20272c] dark:hover:text-[#f0e6d2]"
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>
        ),

        cell: ({ row }) => {
          const item = row.original;
          const isEditing = editingId === item.id;

          if (item.isNew) {
            return (
              <div className="flex items-center justify-center gap-1.5">
                <Button size="sm" variant="default" onClick={handleCreate} disabled={submitting} className="h-8 gap-1 px-2.5 text-xs">
                  {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelAdd} disabled={submitting} className="h-8 gap-1 px-2.5 text-xs dark:border-[#785a28] dark:hover:bg-white/5">
                  <X className="size-3.5" />
                  Cancel
                </Button>
              </div>
            );
          }

          if (isEditing) {
            return (
              <div className="flex items-center justify-center gap-1.5">
                <Button size="sm" variant="default" onClick={() => handleUpdate(item.id)} disabled={submitting} className="h-8 gap-1 px-2.5 text-xs">
                  {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={submitting} className="h-8 gap-1 px-2.5 text-xs dark:border-[#785a28] dark:hover:bg-white/5">
                  <X className="size-3.5" />
                  Cancel
                </Button>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-center gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => handleStartEdit(item)} disabled={submitting || addingRow} className="h-8 w-8 p-0 dark:hover:bg-white/5">
                <Pencil className="size-3.5 text-muted-foreground hover:text-foreground dark:text-[#a09b8c] dark:hover:text-[#f0e6d2]" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(item.id)}
                disabled={submitting || addingRow}
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [
      addingRow,
      editingId,
      handleCancelAdd,
      handleCancelEdit,
      handleColorChange,
      handleCreate,
      handleDelete,
      handleStartEdit,
      handleTextChange,
      handleUpdate,
      submitting,
    ]
  );

  return (
    <FramedDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Group Management"
      className="w-[95vw] max-w-4xl"
      footer={null}
      trigger={
        children ?? (
          <Button variant="ghost" className="w-full justify-start gap-2 text-left">
            <Users className="size-4 text-[#9e7938] dark:text-[#c8aa6e]" />
            <span>Group Management</span>
          </Button>
        )
      }
      innerClassName="md:p-4"
    >
      {/* Header */}
      <div className="mb-4 border-b border-[#c8aa6e]/30 pb-3 dark:border-[#785a28]/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-[#c8aa6e]/10 dark:text-[#c8aa6e]">
              <FolderOpen className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#f0e6d2]">Group Management</h2>
              <p className="text-xs text-muted-foreground dark:text-[#a09b8c]">Add, edit and manage your groups with inline table edit</p>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">{error}</div>}

      <div>
        {!isLoaded ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#9e7938] dark:text-[#c8aa6e]" />
          </div>
        ) : !isSignedIn ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500 dark:text-[#a09b8c]">
            <p>Please log in to view and manage your groups.</p>
          </div>
        ) : loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#9e7938] dark:text-[#c8aa6e]" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-[#c8aa6e]/30 bg-white/50 dark:border-[#785a28]/60 dark:bg-[#091428]/50">
            <DataTable
              columns={columns}
              data={tableData}
              getRowId={getRowId}
              emptyMessage="You haven't created any groups yet. Click 'Add' to create your first group!"
              hideToolbar={true}
            />
          </div>
        )}
      </div>
    </FramedDialog>
  );
}

export default ManageGroupsDialog;
