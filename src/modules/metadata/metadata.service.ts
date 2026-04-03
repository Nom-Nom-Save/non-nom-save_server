import { db } from '../../database';
import { typesOfProducts } from '../../database/schema/types_of_products.schema';
import { typesOfAllergens } from '../../database/schema/types_of_allergens.schema';
import { count } from 'drizzle-orm';
import { PaginationParams } from '../../shared/types/pagination.type';

export const getAllProductTypes = async (
  pagination?: PaginationParams
): Promise<{ productTypes: any[]; total: number }> => {
  const totalCountResult = await db.select({ count: count() }).from(typesOfProducts);
  const total = totalCountResult[0]?.count || 0;

  let query = db.select().from(typesOfProducts);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const productTypes = await query;
  return { productTypes, total };
};

export const getAllAllergens = async (
  pagination?: PaginationParams
): Promise<{ allergens: any[]; total: number }> => {
  const totalCountResult = await db.select({ count: count() }).from(typesOfAllergens);
  const total = totalCountResult[0]?.count || 0;

  let query = db.select().from(typesOfAllergens);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const allergens = await query;
  return { allergens, total };
};
