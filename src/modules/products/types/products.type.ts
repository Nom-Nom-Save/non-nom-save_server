import { products } from '../../../database/schema/products.schema';
import { InferSelectModel } from 'drizzle-orm';

export type Product = InferSelectModel<typeof products> & {
  types?: string[];
  allergens?: string[];
};

export type CreateProductInput = {
  name: string;
  weight?: number;
  description?: string;
  recommendedPrice?: number;
  boundTo: string;
  typeIds?: string[];
  allergenIds?: string[];
};

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'boundTo'>>;
