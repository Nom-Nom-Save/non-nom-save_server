import { db } from '../../database';
import { typesOfProducts } from '../../database/schema/types_of_products.schema';
import { typesOfAllergens } from '../../database/schema/types_of_allergens.schema';

export const getAllProductTypes = async () => {
  return await db.select().from(typesOfProducts);
};

export const getAllAllergens = async () => {
  return await db.select().from(typesOfAllergens);
};
