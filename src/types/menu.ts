import type { Timestamp } from "firebase/firestore";

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  organizationId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  isVeg: boolean;
  imageUrl?: string;
  isAvailable: boolean;
  organizationId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateCategoryInput {
  name: string;
  displayOrder: number;
  organizationId: string;
}

export interface UpdateCategoryInput {
  name?: string;
  displayOrder?: number;
}

export interface CreateMenuItemInput {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  isVeg: boolean;
  imageUrl?: string;
  isAvailable: boolean;
  organizationId: string;
}

export interface UpdateMenuItemInput {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  isVeg?: boolean;
  imageUrl?: string;
  isAvailable?: boolean;
}
