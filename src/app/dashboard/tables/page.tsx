"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { Plus, Pencil, Trash2, LayoutGrid } from "lucide-react";
import { Badge, TABLE_STATUS_VARIANT } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.03 } } };
const cardStagger = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } };

const TABLES_PATH = "/dashboard/tables";

const STATUS_LABELS: Record<TableStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  billing: "Billing",
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
  const variant = TABLE_STATUS_VARIANT[table.status] ?? "muted";
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col p-5 pt-6">
        <div className="flex flex-1 items-start justify-between gap-2">
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
            <Badge variant={variant} className="mt-2">
              {STATUS_LABELS[table.status]}
            </Badge>
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => onEdit(table)}
                className="rounded-xl p-2 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={`Edit ${table.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(table)}
                className="rounded-xl p-2 text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
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
  const prefersReducedMotion = useReducedMotion();
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
          <h1 className="text-2xl font-semibold text-foreground">Tables</h1>
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
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-5 pt-6">
                <div className="h-5 w-24 animate-pulse rounded-lg bg-muted/50" />
                <div className="mt-2 h-4 w-16 animate-pulse rounded-lg bg-muted/50" />
                <div className="mt-3 h-6 w-20 animate-pulse rounded-full bg-muted/50" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <EmptyState
              icon={LayoutGrid}
              title="No tables yet"
              description="Start by adding your restaurant tables to begin managing orders."
              actionLabel={canManage ? "Add table" : undefined}
              onAction={canManage ? openCreate : undefined}
              actionIcon={Plus}
            />
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={prefersReducedMotion ? undefined : gridStagger}
          initial="hidden"
          animate="visible"
        >
          {tables.map((table) => (
            <motion.div key={table.id} variants={prefersReducedMotion ? undefined : cardStagger} transition={{ duration: 0.2 }}>
              <TableCard
                table={table}
                canManage={canManage}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <TableModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        table={editingTable}
      />

      <AnimatePresence>
        {deleteTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => !deleting && setDeleteTarget(null)}
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
            <motion.div
              className="relative z-10 mt-20 w-full max-w-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="w-full shadow-lg rounded-xl">
                <CardContent className="p-6 pt-7">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
