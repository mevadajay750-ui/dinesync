"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { MenuCategory } from "@/types/menu";

const modalBackdrop = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } };
const modalContent = { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: 0.15 } };

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").max(80, "Name too long"),
  displayOrder: z
    .number({ message: "Display order must be a number" })
    .int("Must be a whole number")
    .min(0, "Display order must be 0 or more"),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  mode: "create" | "edit";
  category?: MenuCategory | null;
}

export function CategoryModal({
  open,
  onClose,
  onSubmit,
  mode,
  category,
}: CategoryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && category) {
        setValue("name", category.name);
        setValue("displayOrder", category.displayOrder);
      } else {
        reset({ name: "", displayOrder: 0 });
      }
    }
  }, [open, mode, category, setValue, reset]);

  const handleFormSubmit = async (values: CategoryFormValues) => {
    await onSubmit({
      name: values.name.trim(),
      displayOrder: values.displayOrder,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden
            {...modalBackdrop}
          />
          <motion.div className="relative z-10 w-full max-w-md" {...modalContent}>
            <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle id="category-modal-title">
            {mode === "create" ? "Add category" : "Edit category"}
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
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <Input
              label="Category name"
              placeholder="e.g. Starters, Mains"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Display order"
              type="number"
              min={0}
              placeholder="0"
              error={errors.displayOrder?.message}
              {...register("displayOrder", { valueAsNumber: true })}
            />
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {mode === "create" ? "Create category" : "Save changes"}
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
