import { and, eq, like, sql, count, inArray, gte, desc, asc, exists, or, SQL } from 'drizzle-orm';
import { db } from '../../database';
import { establishments } from '../../database/schema/establishments.schema';
import { reviews } from '../../database/schema/reviews.schema';
import { orders } from '../../database/schema/orders.schema';
import { ordersDetails } from '../../database/schema/orders_details.schema';
import { menuPrices } from '../../database/schema/menu_prices.schema';
import { menu } from '../../database/schema/menu.schema';
import { products } from '../../database/schema/products.schema';
import { boxes } from '../../database/schema/boxes.schema';
import { productTypes } from '../../database/schema/product_types.schema';
import { typeBoxes } from '../../database/schema/type_boxes.schema';
import {
  Establishment,
  UpdateEstablishmentInput,
  PublicEstablishment,
  GetFilteredEstablishmentsParams,
} from './types/establishments.type';
import NodeGeocoder from 'node-geocoder';
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

export const getFilteredEstablishments = async ({
  filters,
  sorting,
  pagination,
}: GetFilteredEstablishmentsParams): Promise<{
  establishments: PublicEstablishment[];
  total: number;
}> => {
  const whereConditions: SQL[] = [eq(establishments.isEmailVerified, true)];

  if (filters.city) {
    whereConditions.push(like(establishments.address, `%${filters.city}%`));
  }

  if (filters.minRating !== undefined) {
    whereConditions.push(gte(establishments.rating, String(filters.minRating)));
  }

  let distanceSql: SQL | null = null;
  if (filters.lat !== undefined && filters.lon !== undefined) {
    distanceSql = sql`6371 * acos(
      cos(radians(${filters.lat})) * cos(radians(${establishments.latitude})) * 
      cos(radians(${establishments.longitude}) - radians(${filters.lon})) + 
      sin(radians(${filters.lat})) * sin(radians(${establishments.latitude}))
    )`;

    if (filters.radius !== undefined) {
      whereConditions.push(sql`${distanceSql} <= ${filters.radius}`);
    }
  }

  if (filters.productTypeIds && filters.productTypeIds.length > 0) {
    const productTypeIds = filters.productTypeIds;

    whereConditions.push(
      exists(
        db
          .select()
          .from(menu)
          .where(
            and(
              eq(menu.establishmentId, establishments.id),
              eq(menu.status, 'Active'),
              or(
                and(
                  eq(menu.itemType, 'Product'),
                  exists(
                    db
                      .select()
                      .from(productTypes)
                      .where(
                        and(
                          eq(productTypes.idProduct, menu.itemId),
                          inArray(productTypes.idType, productTypeIds)
                        )
                      )
                  )
                ),
                and(
                  eq(menu.itemType, 'Box'),
                  exists(
                    db
                      .select()
                      .from(typeBoxes)
                      .where(
                        and(
                          eq(typeBoxes.boxId, menu.itemId),
                          inArray(typeBoxes.typeId, productTypeIds)
                        )
                      )
                  )
                )
              )
            )
          )
      )
    );
  }

  const whereClause = and(...whereConditions);

  const totalCountResult = await db
    .select({ count: count() })
    .from(establishments)
    .where(whereClause);
  const total = totalCountResult[0]?.count || 0;

  const query = db
    .select({
      ...publicFields,
      ...(distanceSql ? { distance: distanceSql } : {}),
    })
    .from(establishments)
    .where(whereClause);
  if (sorting.sortBy === 'rating') {
    query.orderBy(
      sorting.sortOrder === 'asc' ? asc(establishments.rating) : desc(establishments.rating)
    );
  } else if (sorting.sortBy === 'distance' && distanceSql) {
    query.orderBy(sorting.sortOrder === 'asc' ? asc(distanceSql) : desc(distanceSql));
  } else if (sorting.sortBy === 'closingTime') {
    const currentDay = sql`CASE extract(dow from now() at time zone 'utc') 
    WHEN 0 THEN 'sun' WHEN 1 THEN 'mon' WHEN 2 THEN 'tue' 
    WHEN 3 THEN 'wed' WHEN 4 THEN 'thu' WHEN 5 THEN 'fri' 
    WHEN 6 THEN 'sat' END`;

    const currentTime = sql`(now() at time zone 'utc')::time`;
    const regex = sql`${currentDay} || '=([0-9:]{4,5})-([0-9:]{4,5})'`;
    const matchSql = sql`regexp_match(${establishments.workingHours}, ${regex})`;
    const openTimeSql = sql`(${matchSql})[1]::time`;
    const closeTimeSql = sql`(${matchSql})[2]::time`;

    const timeUntilClosing = sql`
    CASE 
      WHEN ${matchSql} IS NOT NULL 
           AND ${currentTime} >= ${openTimeSql} 
           AND ${currentTime} < ${closeTimeSql}
      THEN ${closeTimeSql} - ${currentTime}
      ELSE ${sorting.sortOrder === 'desc' ? sql`'-1 second'::interval` : sql`'999 hours'::interval`}
    END
  `;

    query.orderBy(sorting.sortOrder === 'desc' ? desc(timeUntilClosing) : asc(timeUntilClosing));
  } else {
    query.orderBy(desc(establishments.createdAt));
  }

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query.limit(limit).offset(offset);
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
    } catch (error: unknown) {
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
