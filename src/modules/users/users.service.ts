import { eq, and, sql, inArray, count } from 'drizzle-orm';
import { db } from '../../database';
import { users } from '../../database/schema/users.schema';
import { orders } from '../../database/schema/orders.schema';
import { ordersDetails } from '../../database/schema/orders_details.schema';
import { favoriteEstablishments } from '../../database/schema/favorite_establishments.schema';
import { establishments } from '../../database/schema/establishments.schema';
import { User, UpdateUserInput, FavoriteWithDetails } from './types/users.type';
import { PaginationParams } from '../../shared/types/pagination.type';

export const getUserStats = async (userId: string) => {
  const completedOrders = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.orderStatus, 'Completed')));

  const successfulOrdersCount = completedOrders.length;

  let totalSavings = 0;
  let totalOrderedItems = 0;
  if (successfulOrdersCount > 0) {
    const orderIds = completedOrders.map(o => o.id);
    const details = await db
      .select()
      .from(ordersDetails)
      .where(inArray(ordersDetails.orderId, orderIds));

    for (const detail of details) {
      totalSavings += (detail.originalPrice - detail.price) * detail.quantity;
      totalOrderedItems += detail.quantity;
    }
  }

  return { successfulOrdersCount, totalSavings, totalOrderedItems };
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const [result] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      isEmailVerified: users.isEmailVerified,
      notifyNearby: users.notifyNearby,
      notifyClosingSoon: users.notifyClosingSoon,
      notifyNewItems: users.notifyNewItems,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!result) {
    return null;
  }

  const stats = await getUserStats(userId);

  return { ...result, ...stats };
};

export const updateUser = async (
  userId: string,
  updateData: UpdateUserInput
): Promise<User | null> => {
  const [updatedUser] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      isEmailVerified: users.isEmailVerified,
      notifyNearby: users.notifyNearby,
      notifyClosingSoon: users.notifyClosingSoon,
      notifyNewItems: users.notifyNewItems,
      createdAt: users.createdAt,
    });

  if (!updatedUser) {
    return null;
  }

  const stats = await getUserStats(userId);

  return { ...updatedUser, ...stats };
};

export const addFavorite = async (userId: string, establishmentId: string) => {
  const [favorite] = await db
    .insert(favoriteEstablishments)
    .values({ userId, establishmentId })
    .onConflictDoNothing()
    .returning();
  return favorite;
};

export const removeFavorite = async (userId: string, establishmentId: string) => {
  const result = await db
    .delete(favoriteEstablishments)
    .where(
      and(
        eq(favoriteEstablishments.userId, userId),
        eq(favoriteEstablishments.establishmentId, establishmentId)
      )
    )
    .returning();
  return result.length > 0;
};

export const getFavorites = async (
  userId: string,
  pagination?: PaginationParams
): Promise<{ favorites: FavoriteWithDetails[]; total: number }> => {
  const whereClause = eq(favoriteEstablishments.userId, userId);

  const totalCountResult = await db
    .select({ count: count() })
    .from(favoriteEstablishments)
    .where(whereClause);
  const total = totalCountResult[0]?.count || 0;

  let query = db
    .select({
      favorite: favoriteEstablishments,
      establishment: {
        name: establishments.name,
        address: establishments.address,
        logo: establishments.logo,
        banner: establishments.banner,
        rating: establishments.rating,
      },
    })
    .from(favoriteEstablishments)
    .innerJoin(establishments, eq(favoriteEstablishments.establishmentId, establishments.id))
    .where(whereClause);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const result = await query;

  const favorites = result.map(r => ({
    ...r.favorite,
    establishment: r.establishment,
  }));

  return { favorites, total };
};
