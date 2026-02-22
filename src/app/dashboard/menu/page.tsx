"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { PathGuard } from "@/components/guards/RoleGuard";
import { CategoryModal, type CategoryFormValues } from "@/components/dashboard/CategoryModal";
import { ItemModal, type ItemFormValues } from "@/components/dashboard/ItemModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useMenuRealtime } from "@/hooks/useMenuRealtime";
import { canManageMenu } from "@/lib/permissions";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} from "@/services/menu.service";
import type { MenuCategory, MenuItem } from "@/types/menu";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatCurrency } from "@/lib/utils";

const MENU_PATH = "/dashboard/menu";

function CategorySidebar({
  categories,
  selectedId,
  onSelect,
  onAdd,
  onEditCategory,
  onDeleteCategory,
  canManage,
}: {
  categories: MenuCategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onEditCategory: (c: MenuCategory) => void;
  onDeleteCategory: (c: MenuCategory) => void;
  canManage: boolean;
}) {
  return (
    <aside className="w-full shrink-0 border-r border-border bg-muted/30 md:w-56 lg:w-64 rounded-xl">
      <div className="sticky top-0 flex flex-col p-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
            selectedId === null
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-accent"
          )}
        >
          All items
        </button>
        {categories.map((c) => (
          <div
            key={c.id}
            className={cn(
              "group flex items-center gap-1 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
              selectedId === c.id
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent"
            )}
          >
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left"
              onClick={() => onSelect(c.id)}
            >
              {c.name}
            </button>
            {canManage && (
              <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCategory(c);
                  }}
                  className="rounded-lg p-1 hover:bg-background/20 transition-colors"
                  aria-label={`Edit ${c.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCategory(c);
                  }}
                  className="rounded-lg p-1 hover:bg-destructive/20 transition-colors"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={onAdd}
          >
            Add category
          </Button>
        )}
      </div>
    </aside>
  );
}

function ItemCard({
  item,
  canManage,
  onEdit,
  onDelete,
  onToggleAvailability,
}: {
  item: MenuItem;
  canManage: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onToggleAvailability: (item: MenuItem) => void;
}) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:scale-[1.02]">
      <div className="aspect-4/3 relative bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-border bg-gray-100 px-4 dark:bg-gray-800/70">
            <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" aria-hidden />
            <span className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
              No image
            </span>
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-1.5">
          <Badge
            variant={item.isVeg ? "success" : "danger"}
            className={item.isVeg ? "!bg-success !text-white" : "!bg-danger !text-white"}
          >
            {item.isVeg ? "Veg" : "Non-Veg"}
          </Badge>
          <Badge variant={item.isAvailable ? "success" : "warning"}>
            {item.isAvailable ? "In stock" : "Out of stock"}
          </Badge>
        </div>
      </div>
      <CardContent className="p-5">
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
            {item.description && (
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3">
            {canManage ? (
              <>
                <button
                  type="button"
                  onClick={() => onToggleAvailability(item)}
                  className={cn(
                    "shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
                    item.isAvailable
                      ? "bg-muted text-muted-foreground hover:bg-warning/20 hover:text-warning"
                      : "bg-muted text-muted-foreground hover:bg-success/20 hover:text-success"
                  )}
                  aria-label={item.isAvailable ? "Mark out of stock" : "Mark in stock"}
                >
                  {item.isAvailable ? "Out" : "In"}
                </button>
                <p className="min-w-0 shrink-0 text-right text-sm font-medium text-foreground">
                  {formatCurrency(Number(item.price))}
                </p>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded-xl p-2 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="rounded-xl p-2 text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <p className="ml-auto text-sm font-medium text-foreground">
                {formatCurrency(Number(item.price))}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MenuPageContent() {
  const { user } = useAuth();
  const toast = useToast();
  const organizationId = user?.organizationId ?? null;
  const canManage = user ? canManageMenu(user.role) : false;

  const { categories, items, loading, error } = useMenuRealtime(organizationId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryMode, setCategoryMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemMode, setItemMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<MenuCategory | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredItems = useMemo(() => {
    if (!selectedCategoryId) return items;
    return items.filter((i) => i.categoryId === selectedCategoryId);
  }, [items, selectedCategoryId]);

  const openAddCategory = useCallback(() => {
    setEditingCategory(null);
    setCategoryMode("create");
    setCategoryModalOpen(true);
  }, []);

  const openEditCategory = useCallback((category: MenuCategory) => {
    setEditingCategory(category);
    setCategoryMode("edit");
    setCategoryModalOpen(true);
  }, []);

  const openAddItem = useCallback(() => {
    setEditingItem(null);
    setItemMode("create");
    setItemModalOpen(true);
  }, []);

  const openEditItem = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setItemMode("edit");
    setItemModalOpen(true);
  }, []);

  const handleCategorySubmit = useCallback(
    async (values: CategoryFormValues) => {
      if (!organizationId) {
        toast.error("Organization not found.");
        return;
      }
      try {
        if (categoryMode === "create") {
          await createCategory({
            organizationId,
            name: values.name,
            displayOrder: values.displayOrder,
          });
          toast.success("Category created.");
        } else if (editingCategory) {
          await updateCategory(organizationId, editingCategory.id, {
            name: values.name,
            displayOrder: values.displayOrder,
          });
          toast.success("Category updated.");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        toast.error(message);
        throw err;
      }
    },
    [organizationId, categoryMode, editingCategory, toast]
  );

  const handleItemSubmit = useCallback(
    async (values: ItemFormValues & { imageUrl?: string }) => {
      if (!organizationId) {
        toast.error("Organization not found.");
        return;
      }
      try {
        if (itemMode === "create") {
          await createMenuItem({
            organizationId,
            name: values.name,
            description: values.description,
            price: values.price,
            categoryId: values.categoryId,
            isVeg: values.isVeg,
            imageUrl: values.imageUrl,
            isAvailable: values.isAvailable,
          });
          toast.success("Menu item created.");
        } else if (editingItem) {
          await updateMenuItem(organizationId, editingItem.id, {
            name: values.name,
            description: values.description,
            price: values.price,
            categoryId: values.categoryId,
            isVeg: values.isVeg,
            imageUrl: values.imageUrl !== undefined ? values.imageUrl : undefined,
            isAvailable: values.isAvailable,
          });
          toast.success("Menu item updated.");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        toast.error(message);
        throw err;
      }
    },
    [organizationId, itemMode, editingItem, toast]
  );

  const handleToggleAvailability = useCallback(
    async (item: MenuItem) => {
      if (!organizationId) return;
      try {
        await toggleAvailability(organizationId, item.id, !item.isAvailable);
        toast.success(item.isAvailable ? "Marked out of stock." : "Marked in stock.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update.");
      }
    },
    [organizationId, toast]
  );

  const handleDeleteCategory = useCallback(async () => {
    const cat = deleteCategoryTarget;
    if (!cat || !organizationId) return;
    setDeleting(true);
    try {
      await deleteCategory(organizationId, cat.id);
      toast.success("Category deleted.");
      setDeleteCategoryTarget(null);
      setSelectedCategoryId((id) => (id === cat.id ? null : id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category.");
    } finally {
      setDeleting(false);
    }
  }, [deleteCategoryTarget, organizationId, toast]);

  const handleDeleteItem = useCallback(async () => {
    const it = deleteItemTarget;
    if (!it || !organizationId) return;
    setDeleting(true);
    try {
      await deleteMenuItem(organizationId, it.id);
      toast.success("Menu item deleted.");
      setDeleteItemTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete item.");
    } finally {
      setDeleting(false);
    }
  }, [deleteItemTarget, organizationId, toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Menu</h2>
          <p className="text-muted-foreground">
            Manage categories and menu items. Updates in real time.
          </p>
        </div>
        {canManage && (
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openAddItem}
          >
            Add item
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 md:gap-0">
        <CategorySidebar
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          onAdd={openAddCategory}
          onEditCategory={openEditCategory}
          onDeleteCategory={setDeleteCategoryTarget}
          canManage={canManage}
        />
        <main className="flex-1 min-w-0 p-4 md:p-6">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-4/3 animate-pulse bg-muted/50" />
                  <CardContent className="p-5">
                    <div className="h-5 w-32 animate-pulse rounded-lg bg-muted/50" />
                    <div className="mt-2 h-4 w-24 animate-pulse rounded-lg bg-muted/50" />
                    <div className="mt-3 h-5 w-16 animate-pulse rounded-lg bg-muted/50" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  No categories yet. Add a category, then add menu items.
                </p>
                {canManage && (
                  <Button
                    className="mt-4"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={openAddCategory}
                  >
                    Add category
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  {selectedCategoryId
                    ? "No items in this category."
                    : "No menu items yet."}
                </p>
                {canManage && (
                  <Button
                    className="mt-4"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={openAddItem}
                  >
                    Add item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  canManage={canManage}
                  onEdit={openEditItem}
                  onDelete={setDeleteItemTarget}
                  onToggleAvailability={handleToggleAvailability}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSubmit={handleCategorySubmit}
        mode={categoryMode}
        category={editingCategory}
      />

      <ItemModal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSubmit={handleItemSubmit}
        mode={itemMode}
        item={editingItem}
        categories={categories}
        organizationId={organizationId ?? ""}
      />

      {deleteCategoryTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !deleting && setDeleteCategoryTarget(null)}
            aria-hidden
          />
          <Card className="relative z-10 mt-20 w-full max-w-sm shadow-lg">
            <CardContent className="p-6 pt-7">
              <h3 id="delete-category-title" className="font-semibold text-foreground">
                Delete category?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                &quot;{deleteCategoryTarget.name}&quot; will be permanently removed.
                Items in this category will keep the category reference.
              </p>
              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => !deleting && setDeleteCategoryTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  loading={deleting}
                  onClick={handleDeleteCategory}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {deleteItemTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-item-title"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !deleting && setDeleteItemTarget(null)}
            aria-hidden
          />
          <Card className="relative z-10 mt-20 w-full max-w-sm shadow-lg">
            <CardContent className="p-6 pt-7">
              <h3 id="delete-item-title" className="font-semibold text-foreground">
                Delete menu item?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                &quot;{deleteItemTarget.name}&quot; will be permanently removed.
              </p>
              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => !deleting && setDeleteItemTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  loading={deleting}
                  onClick={handleDeleteItem}
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

export default function MenuPage() {
  return (
    <PathGuard pathname={MENU_PATH}>
      <MenuPageContent />
    </PathGuard>
  );
}
