"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { uploadMenuItemImage } from "@/lib/firebase/storage";
import type { MenuCategory, MenuItem } from "@/types/menu";
import { cn } from "@/lib/utils";
import { ImagePlus, X } from "lucide-react";

const modalBackdrop = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } };
const modalContent = { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: 0.15 } };

const itemFormSchema = z.object({
  name: z.string().min(1, "Item name is required").max(120, "Name too long"),
  description: z.string().max(500, "Description too long").optional().or(z.literal("")),
  price: z
    .number({ message: "Price must be a number" })
    .positive("Price must be greater than 0")
    .finite("Invalid price"),
  categoryId: z.string().min(1, "Please select a category"),
  isVeg: z.boolean(),
  isAvailable: z.boolean(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

interface ItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ItemFormValues & { imageUrl?: string }) => Promise<void>;
  mode: "create" | "edit";
  item?: MenuItem | null;
  categories: MenuCategory[];
  organizationId: string;
}

export function ItemModal({
  open,
  onClose,
  onSubmit,
  mode,
  item,
  categories,
  organizationId,
}: ItemModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      isVeg: true,
      isAvailable: true,
    },
  });

  const isVeg = watch("isVeg");
  const isAvailable = watch("isAvailable");

  useEffect(() => {
    if (open) {
      if (mode === "edit" && item) {
        setValue("name", item.name);
        setValue("description", item.description ?? "");
        setValue("price", item.price);
        setValue("categoryId", item.categoryId);
        setValue("isVeg", item.isVeg);
        setValue("isAvailable", item.isAvailable);
        setImageFile(null);
        setImagePreview(null);
        setUploadedUrl(item.imageUrl ?? null);
        setImageRemoved(false);
      } else {
        reset({
          name: "",
          description: "",
          price: 0,
          categoryId: categories[0]?.id ?? "",
          isVeg: true,
          isAvailable: true,
        });
        setImageFile(null);
        setImagePreview(null);
        setUploadedUrl(null);
        setImageRemoved(false);
      }
    }
  }, [open, mode, item, categories, setValue, reset]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      return; // 5MB max
    }
    setImageFile(file);
    setUploadedUrl(null);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadedUrl(null);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormSubmit = async (values: ItemFormValues) => {
    let imageUrl: string | undefined | "" = undefined;
    if (imageFile && organizationId) {
      setImageUploading(true);
      try {
        imageUrl = await uploadMenuItemImage(imageFile, organizationId);
      } finally {
        setImageUploading(false);
      }
    } else if (mode === "edit" && item?.imageUrl && !imageRemoved) {
      imageUrl = item.imageUrl;
    } else if (imageRemoved) {
      imageUrl = "";
    }
    await onSubmit({
      ...values,
      description: values.description?.trim() || undefined,
      imageUrl: imageRemoved ? "" : (imageUrl || undefined),
    });
    onClose();
  };

  const loading = isSubmitting || imageUploading;

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="item-modal-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden
            {...modalBackdrop}
          />
          <motion.div
            className="relative z-10 w-full max-w-lg my-8"
            {...modalContent}
          >
            <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle id="item-modal-title">
            {mode === "create" ? "Add menu item" : "Edit menu item"}
          </CardTitle>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <Input
              label="Name"
              placeholder="e.g. Margherita Pizza"
              error={errors.name?.message}
              {...register("name")}
            />
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Description (optional)
              </label>
              <textarea
                {...register("description")}
                placeholder="Short description"
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:opacity-50 transition-all duration-200"
              />
              {errors.description?.message && (
                <p className="mt-1 text-sm text-danger">
                  {errors.description.message}
                </p>
              )}
            </div>
            <Input
              label="Price"
              type="number"
              step="0.01"
              min={0}
              placeholder="0.00"
              error={errors.price?.message}
              {...register("price", { valueAsNumber: true })}
            />
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Category
              </label>
              <select
                {...register("categoryId")}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 transition-all duration-200"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId?.message && (
                <p className="mt-1 text-sm text-danger">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Veg</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isVeg}
                  onClick={() => setValue("isVeg", !isVeg)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-input transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2",
                    isVeg ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow ring-0 transition translate-x-0.5",
                      isVeg ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
                <span className="text-sm text-muted-foreground">
                  {isVeg ? "Veg" : "Non-Veg"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Available</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAvailable}
                  onClick={() => setValue("isAvailable", !isAvailable)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-input transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2",
                    isAvailable ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow ring-0 transition translate-x-0.5",
                      isAvailable ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
                <span className="text-sm text-muted-foreground">
                  {isAvailable ? "In stock" : "Out of stock"}
                </span>
              </div>
            </div>

            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Image (optional)
              </label>
              <div className="flex flex-col gap-2">
                {(imagePreview || (mode === "edit" && item?.imageUrl && !imagePreview && !imageRemoved)) && (
                  <div className="relative inline-block w-full max-w-[200px]">
                    <img
                      src={imagePreview ?? item?.imageUrl ?? ""}
                      alt="Preview"
                      className="h-28 w-full rounded-md border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {!imagePreview && !(mode === "edit" && item?.imageUrl && !imageRemoved) && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-28 w-full max-w-[200px] items-center justify-center rounded-xl border border-dashed border-input bg-muted/30 text-muted-foreground transition-all duration-200 hover:bg-muted/50"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <ImagePlus className="h-8 w-8" />
                  </button>
                )}
                {!imagePreview && mode === "edit" && item?.imageUrl && !imageRemoved && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-all duration-200 hover:bg-accent"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <ImagePlus className="h-4 w-4" /> Change image
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {mode === "create" ? "Create item" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
