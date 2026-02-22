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
  MenuCategory,
  MenuItem,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from "@/types/menu";

const DEFAULT_MAX_CATEGORIES = 200;
const DEFAULT_MAX_ITEMS = 2000;

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategoriesByOrg(
  organizationId: string,
  maxResults = DEFAULT_MAX_CATEGORIES
): Promise<MenuCategory[]> {
  const list = await getDocuments<MenuCategory & { id: string }>(
    COLLECTIONS.MENU_CATEGORIES,
    where("organizationId", "==", organizationId),
    orderBy("displayOrder", "asc"),
    orderBy("createdAt", "asc"),
    limit(maxResults)
  );
  return list.map((c) => ({ ...c, id: c.id }));
}

export async function createCategory(input: CreateCategoryInput): Promise<string> {
  const ref = await addDocument(COLLECTIONS.MENU_CATEGORIES, {
    organizationId: input.organizationId,
    name: input.name.trim(),
    displayOrder: Number(input.displayOrder),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCategory(
  organizationId: string,
  categoryId: string,
  input: UpdateCategoryInput
): Promise<void> {
  const existing = await getCategoryById(organizationId, categoryId);
  if (!existing) {
    throw new Error("Category not found or access denied");
  }
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.displayOrder !== undefined)
    payload.displayOrder = Number(input.displayOrder);
  await updateDocument(COLLECTIONS.MENU_CATEGORIES, payload, categoryId);
}

export async function getCategoryById(
  organizationId: string,
  categoryId: string
): Promise<MenuCategory | null> {
  const category = await getDocument<MenuCategory & { id: string }>(
    COLLECTIONS.MENU_CATEGORIES,
    categoryId
  );
  if (!category || category.organizationId !== organizationId) return null;
  return { ...category, id: category.id };
}

export async function deleteCategory(
  organizationId: string,
  categoryId: string
): Promise<void> {
  const existing = await getCategoryById(organizationId, categoryId);
  if (!existing) {
    throw new Error("Category not found or access denied");
  }
  await deleteDocument(COLLECTIONS.MENU_CATEGORIES, categoryId);
}

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

export async function getMenuItemsByOrg(
  organizationId: string,
  maxResults = DEFAULT_MAX_ITEMS
): Promise<MenuItem[]> {
  const list = await getDocuments<MenuItem & { id: string }>(
    COLLECTIONS.MENU_ITEMS,
    where("organizationId", "==", organizationId),
    orderBy("categoryId", "asc"),
    orderBy("createdAt", "asc"),
    limit(maxResults)
  );
  return list.map((m) => ({ ...m, id: m.id }));
}

export async function createMenuItem(input: CreateMenuItemInput): Promise<string> {
  const ref = await addDocument(COLLECTIONS.MENU_ITEMS, {
    organizationId: input.organizationId,
    name: input.name.trim(),
    description: input.description?.trim() ?? null,
    price: Number(input.price),
    categoryId: input.categoryId,
    isVeg: Boolean(input.isVeg),
    imageUrl: input.imageUrl ?? null,
    isAvailable: Boolean(input.isAvailable),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getMenuItemById(
  organizationId: string,
  itemId: string
): Promise<MenuItem | null> {
  const item = await getDocument<MenuItem & { id: string }>(
    COLLECTIONS.MENU_ITEMS,
    itemId
  );
  if (!item || item.organizationId !== organizationId) return null;
  return { ...item, id: item.id };
}

export async function updateMenuItem(
  organizationId: string,
  itemId: string,
  input: UpdateMenuItemInput
): Promise<void> {
  const existing = await getMenuItemById(organizationId, itemId);
  if (!existing) {
    throw new Error("Menu item not found or access denied");
  }
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined)
    payload.description = input.description?.trim() ?? null;
  if (input.price !== undefined) payload.price = Number(input.price);
  if (input.categoryId !== undefined) payload.categoryId = input.categoryId;
  if (input.isVeg !== undefined) payload.isVeg = Boolean(input.isVeg);
  if (input.imageUrl !== undefined) payload.imageUrl = input.imageUrl ?? null;
  if (input.isAvailable !== undefined)
    payload.isAvailable = Boolean(input.isAvailable);
  await updateDocument(COLLECTIONS.MENU_ITEMS, payload, itemId);
}

export async function deleteMenuItem(
  organizationId: string,
  itemId: string
): Promise<void> {
  const existing = await getMenuItemById(organizationId, itemId);
  if (!existing) {
    throw new Error("Menu item not found or access denied");
  }
  await deleteDocument(COLLECTIONS.MENU_ITEMS, itemId);
}

export async function toggleAvailability(
  organizationId: string,
  itemId: string,
  isAvailable: boolean
): Promise<void> {
  await updateMenuItem(organizationId, itemId, { isAvailable });
}
