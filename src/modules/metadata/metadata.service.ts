import { db } from '../../database';
import { typesOfProducts } from '../../database/schema/types_of_products.schema';
import { typesOfAllergens } from '../../database/schema/types_of_allergens.schema';
import { count } from 'drizzle-orm';
import { PaginationParams } from '../../shared/types/pagination.type';
import { GetAllergensResponse, GetProductTypesResponse } from './types/metadata.types';

export const getAllProductTypes = async (
  pagination?: PaginationParams
): Promise<GetProductTypesResponse> => {
  const totalCountResult = await db.select({ count: count() }).from(typesOfProducts);
  const total = Number(totalCountResult[0]?.count || 0);

  const query = db.select().from(typesOfProducts);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    const productTypes = await query.limit(limit).offset(offset);
    return { productTypes, total };
  }

  const productTypes = await query;
  return { productTypes, total };
};

export const getAllAllergens = async (
  pagination?: PaginationParams
): Promise<GetAllergensResponse> => {
  const totalCountResult = await db.select({ count: count() }).from(typesOfAllergens);
  const total = Number(totalCountResult[0]?.count || 0);

  const query = db.select().from(typesOfAllergens);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    const allergens = await query.limit(limit).offset(offset);
    return { allergens, total };
  }

  const allergens = await query;
  return { allergens, total };
};
