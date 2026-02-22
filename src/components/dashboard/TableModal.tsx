"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Table } from "@/types/table";

const tableFormSchema = z.object({
  name: z.string().min(1, "Table name is required").max(80, "Name too long"),
  capacity: z
    .number({ message: "Capacity must be a number" })
    .int("Must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(50, "Capacity cannot exceed 50"),
  floor: z.string().max(40, "Floor label too long").optional().or(z.literal("")),
});

export type TableFormValues = z.infer<typeof tableFormSchema>;

interface TableModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TableFormValues) => Promise<void>;
  mode: "create" | "edit";
  table?: Table | null;
}

export function TableModal({
  open,
  onClose,
  onSubmit,
  mode,
  table,
}: TableModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      name: "",
      capacity: 2,
      floor: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && table) {
        setValue("name", table.name);
        setValue("capacity", table.capacity);
        setValue("floor", table.floor ?? "");
      } else {
        reset({ name: "", capacity: 2, floor: "" });
      }
    }
  }, [open, mode, table, setValue, reset]);

  if (!open) return null;

  const handleFormSubmit = async (values: TableFormValues) => {
    await onSubmit({
      name: values.name,
      capacity: values.capacity,
      floor: values.floor?.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <Card className="relative z-10 w-full max-w-md shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle id="table-modal-title">
            {mode === "create" ? "Add table" : "Edit table"}
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
              label="Table name"
              placeholder="e.g. Table 1"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Capacity"
              type="number"
              min={1}
              max={50}
              placeholder="2"
              error={errors.capacity?.message}
              {...register("capacity", { valueAsNumber: true })}
            />
            <Input
              label="Floor (optional)"
              placeholder="e.g. Ground, Mezzanine"
              error={errors.floor?.message}
              {...register("floor")}
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
                {mode === "create" ? "Create table" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
