import { and, eq, like, sql, count, inArray } from 'drizzle-orm';
import { db } from '../../database';
import { establishments } from '../../database/schema/establishments.schema';
import { reviews } from '../../database/schema/reviews.schema';
import { orders } from '../../database/schema/orders.schema';
import { ordersDetails } from '../../database/schema/orders_details.schema';
import { menuPrices } from '../../database/schema/menu_prices.schema';
import { menu } from '../../database/schema/menu.schema';
import { products } from '../../database/schema/products.schema';
import { boxes } from '../../database/schema/boxes.schema';
import {
  Establishment,
  UpdateEstablishmentInput,
  PublicEstablishment,
} from './types/establishments.type';
import NodeGeocoder from 'node-geocoder';
import { PaginationParams } from '../../shared/types/pagination.type';
import { formatWeight } from '../../shared/utils/weight.util';

const publicFields = {
  id: establishments.id,
  name: establishments.name,
  description: establishments.description,
  address: establishments.address,
  latitude: establishments.latitude,
  longitude: establishments.longitude,
  workingHours: establishments.workingHours,
  logo: establishments.logo,
  banner: establishments.banner,
  rating: establishments.rating,
  createdAt: establishments.createdAt,
};

export const getAllEstablishments = async (
  pagination?: PaginationParams
): Promise<{ establishments: PublicEstablishment[]; total: number }> => {
  const totalCountResult = await db.select({ count: count() }).from(establishments);
  const total = totalCountResult[0]?.count || 0;

  let query = db.select(publicFields).from(establishments);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const results = (await query) as PublicEstablishment[];
  return { establishments: results, total };
};

export const getEstablishmentsByCity = async (
  city: string,
  pagination?: PaginationParams
): Promise<{ establishments: PublicEstablishment[]; total: number }> => {
  const whereClause = and(
    eq(establishments.isEmailVerified, true),
    like(establishments.address, `%${city}%`)
  );

  const totalCountResult = await db
    .select({ count: count() })
    .from(establishments)
    .where(whereClause);
  const total = totalCountResult[0]?.count || 0;

  let query = db.select(publicFields).from(establishments).where(whereClause);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const results = (await query) as PublicEstablishment[];
  return { establishments: results, total };
};

export const getEstablishmentsByRadius = async (
  lat: number,
  lon: number,
  radiusKm: number,
  pagination?: PaginationParams
): Promise<{ establishments: PublicEstablishment[]; total: number }> => {
  const distanceSql = sql`6371 * acos(
    cos(radians(${lat})) * cos(radians(latitude)) * 
    cos(radians(longitude) - radians(${lon})) + 
    sin(radians(${lat})) * sin(radians(latitude))
  )`;

  const whereClause = and(
    eq(establishments.isEmailVerified, true),
    sql`${distanceSql} <= ${radiusKm}`
  );

  const totalCountResult = await db
    .select({ count: count() })
    .from(establishments)
    .where(whereClause);
  const total = totalCountResult[0]?.count || 0;

  let query = db.select(publicFields).from(establishments).where(whereClause);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const results = (await query) as PublicEstablishment[];
  return { establishments: results, total };
};

export const updateEstablishment = async (
  establishmentId: string,
  updateData: UpdateEstablishmentInput
): Promise<Establishment | null> => {
  const dataToUpdate = { ...updateData };

  if (updateData.address) {
    const options: NodeGeocoder.Options = {
      provider: 'openstreetmap',
      language: 'en',
    };

    const geocoder = NodeGeocoder(options);

    try {
      const response = await geocoder.geocode(updateData.address);

      if (response.length > 0 && response[0].latitude && response[0].longitude) {
        dataToUpdate.latitude = String(response[0].latitude);
        dataToUpdate.longitude = String(response[0].longitude);
      }
    } catch (error) {
      console.error('Geocoding error during establishment update:', error);
    }
  }

  const updatedEstablishment = await db
    .update(establishments)
    .set(dataToUpdate)
    .where(eq(establishments.id, establishmentId))
    .returning();

  if (!updatedEstablishment || updatedEstablishment.length === 0) {
    return null;
  }

  return updatedEstablishment[0];
};

const getEstablishmentStats = async (establishmentId: string) => {
  const completedOrders = await db
    .select({
      id: orders.id,
    })
    .from(orders)
    .innerJoin(ordersDetails, eq(orders.id, ordersDetails.orderId))
    .innerJoin(menuPrices, eq(ordersDetails.menuPriceId, menuPrices.id))
    .innerJoin(menu, eq(menuPrices.menuItemId, menu.id))
    .where(and(eq(menu.establishmentId, establishmentId), eq(orders.orderStatus, 'Completed')))
    .groupBy(orders.id);

  const bagsSold = completedOrders.length;
  let totalWeightGrams = 0;

  if (bagsSold > 0) {
    const orderIds = completedOrders.map(o => o.id);
    const details = await db
      .select({
        quantity: ordersDetails.quantity,
        itemType: menu.itemType,
        itemId: menu.itemId,
      })
      .from(ordersDetails)
      .innerJoin(menuPrices, eq(ordersDetails.menuPriceId, menuPrices.id))
      .innerJoin(menu, eq(menuPrices.menuItemId, menu.id))
      .where(inArray(ordersDetails.orderId, orderIds));

    for (const detail of details) {
      if (detail.itemType === 'Product') {
        const [p] = await db
          .select({ weight: products.weight })
          .from(products)
          .where(eq(products.id, detail.itemId));
        if (p?.weight) {
          totalWeightGrams += p.weight * detail.quantity;
        }
      } else {
        const [b] = await db
          .select({ minWeight: boxes.minWeight, maxWeight: boxes.maxWeight })
          .from(boxes)
          .where(eq(boxes.id, detail.itemId));
        if (b?.minWeight !== null && b?.maxWeight !== null) {
          const averageWeight = (b.minWeight + b.maxWeight) / 2;
          totalWeightGrams += averageWeight * detail.quantity;
        }
      }
    }
  }

  return {
    bagsSold,
    foodSaved: formatWeight(totalWeightGrams),
  };
};

export const getEstablishmentById = async (
  establishmentId: string
): Promise<
  (PublicEstablishment & { reviewCount: number; bagsSold: number; foodSaved: string }) | null
> => {
  const result = (await db
    .select(publicFields)
    .from(establishments)
    .where(eq(establishments.id, establishmentId))) as PublicEstablishment[];

  if (!result || result.length === 0) {
    return null;
  }

  const [reviewData] = await db
    .select({ count: count() })
    .from(reviews)
    .where(eq(reviews.establishmentId, establishmentId));

  const stats = await getEstablishmentStats(establishmentId);

  return {
    ...result[0],
    reviewCount: reviewData?.count || 0,
    ...stats,
  };
};

export const getEstablishmentByIdPrivate = async (
  establishmentId: string
): Promise<
  (Establishment & { reviewCount: number; bagsSold: number; foodSaved: string }) | null
> => {
  const result = await db
    .select()
    .from(establishments)
    .where(eq(establishments.id, establishmentId));

  if (!result || result.length === 0) {
    return null;
  }

  const [reviewData] = await db
    .select({ count: count() })
    .from(reviews)
    .where(eq(reviews.establishmentId, establishmentId));

  const stats = await getEstablishmentStats(establishmentId);

  return {
    ...result[0],
    reviewCount: reviewData?.count || 0,
    ...stats,
  };
};
