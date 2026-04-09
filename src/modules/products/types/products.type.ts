import { products } from '../../../database/schema/products.schema';
import { InferSelectModel } from 'drizzle-orm';
import { PaginationParams } from '../../../shared/types/pagination.type';

export type Product = InferSelectModel<typeof products> & {
  types?: string[];
  allergens?: string[];
};

export type RawProduct = InferSelectModel<typeof products>;

export type CreateProductInput = {
  name: string;
  picture?: string;
  weight?: number;
  description?: string;
  recommendedPrice?: number;
  boundTo: string;
  typeIds?: string[];
  allergenIds?: string[];
};

export type UpdateProductInput = Partial<CreateProductInput>;

export type GetProductsParams = {
  establishmentBoundTo: string;
  filterType?: 'Private' | 'All';
  pagination?: PaginationParams;
};
