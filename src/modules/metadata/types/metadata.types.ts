import { InferSelectModel } from 'drizzle-orm';
import { typesOfProducts } from '../../../database/schema/types_of_products.schema';
import { typesOfAllergens } from '../../../database/schema/types_of_allergens.schema';

export type ProductType = InferSelectModel<typeof typesOfProducts>;
export type Allergen = InferSelectModel<typeof typesOfAllergens>;

export interface GetProductTypesResponse {
  productTypes: ProductType[];
  total: number;
}

export interface GetAllergensResponse {
  allergens: Allergen[];
  total: number;
}
