import { serverTimestamp } from "firebase/firestore";
import {
  getDocuments,
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
  limit,
} from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import type {
  Table,
  TableStatus,
  CreateTableInput,
  UpdateTableInput,
} from "@/types/table";

const DEFAULT_MAX_TABLES = 100;

export async function getTablesByOrganization(
  organizationId: string,
  maxResults = DEFAULT_MAX_TABLES
): Promise<Table[]> {
  const list = await getDocuments<Table & { id: string }>(
    COLLECTIONS.TABLES,
    where("organizationId", "==", organizationId),
    orderBy("createdAt", "desc"),
    limit(maxResults)
  );
  return list.map((t) => ({ ...t, id: t.id }));
}

export async function createTable(input: CreateTableInput): Promise<string> {
  const ref = await addDocument(COLLECTIONS.TABLES, {
    organizationId: input.organizationId,
    name: input.name.trim(),
    floor: input.floor?.trim() ?? null,
    capacity: Number(input.capacity),
    status: "available" as TableStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTableById(
  organizationId: string,
  tableId: string
): Promise<Table | null> {
  const table = await getDocument<Table & { id: string }>(
    COLLECTIONS.TABLES,
    tableId
  );
  if (!table || table.organizationId !== organizationId) return null;
  return { ...table, id: table.id };
}

export async function updateTable(
  organizationId: string,
  tableId: string,
  input: UpdateTableInput
): Promise<void> {
  const existing = await getTableById(organizationId, tableId);
  if (!existing) {
    throw new Error("Table not found or access denied");
  }
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.floor !== undefined) payload.floor = input.floor?.trim() ?? null;
  if (input.capacity !== undefined) payload.capacity = Number(input.capacity);
  if (input.status !== undefined) payload.status = input.status;
  if (input.activeOrderId !== undefined)
    payload.activeOrderId = input.activeOrderId;
  await updateDocument(COLLECTIONS.TABLES, payload, tableId);
}

export async function updateTableStatus(
  organizationId: string,
  tableId: string,
  status: TableStatus,
  activeOrderId?: string
): Promise<void> {
  await updateTable(organizationId, tableId, {
    status,
    ...(activeOrderId !== undefined && { activeOrderId }),
  });
}

export async function deleteTable(
  organizationId: string,
  tableId: string
): Promise<void> {
  const existing = await getTableById(organizationId, tableId);
  if (!existing) {
    throw new Error("Table not found or access denied");
  }
  await deleteDocument(COLLECTIONS.TABLES, tableId);
}
