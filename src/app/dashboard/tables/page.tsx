"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { PathGuard } from "@/components/guards/RoleGuard";
import { TableModal, type TableFormValues } from "@/components/dashboard/TableModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useTablesRealtime } from "@/hooks/useTablesRealtime";
import { canManageTables } from "@/lib/permissions";
import {
  createTable,
  updateTable,
  deleteTable,
} from "@/services/table.service";
import type { Table, TableStatus } from "@/types/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TABLES_PATH = "/dashboard/tables";

const STATUS_STYLES: Record<
  TableStatus,
  { label: string; className: string }
> = {
  available: {
    label: "Available",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  occupied: {
    label: "Occupied",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  billing: {
    label: "Billing",
    className: "bg-red-500/15 text-red-700 dark:text-red-400",
  },
};

function TableCard({
  table,
  canManage,
  onEdit,
  onDelete,
}: {
  table: Table;
  canManage: boolean;
  onEdit: (t: Table) => void;
  onDelete: (t: Table) => void;
}) {
  const statusStyle = STATUS_STYLES[table.status];
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">
              {table.name}
            </h3>
            {table.floor && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {table.floor}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Capacity: {table.capacity}
            </p>
            <span
              className={cn(
                "inline-block mt-2 rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusStyle.className
              )}
            >
              {statusStyle.label}
            </span>
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => onEdit(table)}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={`Edit ${table.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(table)}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={`Delete ${table.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TablesPageContent() {
  const { user } = useAuth();
  const toast = useToast();
  const organizationId = user?.organizationId ?? null;
  const canManage = user ? canManageTables(user.role) : false;

  const { tables, loading, error } = useTablesRealtime(organizationId);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = useCallback(() => {
    setEditingTable(null);
    setModalMode("create");
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((table: Table) => {
    setEditingTable(table);
    setModalMode("edit");
    setModalOpen(true);
  }, []);

  const handleModalSubmit = useCallback(
    async (values: TableFormValues) => {
      if (!organizationId) {
        toast.error("Organization not found.");
        return;
      }
      try {
        if (modalMode === "create") {
          await createTable({
            organizationId,
            name: values.name,
            capacity: values.capacity,
            floor: values.floor,
          });
          toast.success("Table created.");
        } else if (editingTable) {
          await updateTable(organizationId, editingTable.id, {
            name: values.name,
            capacity: values.capacity,
            floor: values.floor,
          });
          toast.success("Table updated.");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        toast.error(message);
        throw err;
      }
    },
    [organizationId, modalMode, editingTable, toast]
  );

  const handleDeleteConfirm = useCallback(async () => {
    const table = deleteTarget;
    if (!table || !organizationId) return;
    setDeleting(true);
    try {
      await deleteTable(organizationId, table.id);
      toast.success("Table deleted.");
      setDeleteTarget(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete table.";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, organizationId, toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tables</h2>
          <p className="text-muted-foreground">
            Manage tables and seating. Status updates in real time.
          </p>
        </div>
        {canManage && (
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add table
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-16 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-6 w-20 animate-pulse rounded-full bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              No tables yet. Add your first table to get started.
            </p>
            {canManage && (
              <Button
                className="mt-4"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={openCreate}
              >
                Add table
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              canManage={canManage}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <TableModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        table={editingTable}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !deleting && setDeleteTarget(null)}
            aria-hidden
          />
          <Card className="relative z-10 w-full max-w-sm shadow-lg">
            <CardContent className="p-6">
              <h3 id="delete-modal-title" className="font-semibold text-foreground">
                Delete table?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                &quot;{deleteTarget.name}&quot; will be permanently removed. This
                cannot be undone.
              </p>
              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => !deleting && setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  loading={deleting}
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function TablesPage() {
  return (
    <PathGuard pathname={TABLES_PATH}>
      <TablesPageContent />
    </PathGuard>
  );
}
