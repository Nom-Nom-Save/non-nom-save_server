import { eq, and } from 'drizzle-orm';
import { db } from '../../database';
import { users } from '../../database/schema/users.schema';
import { favoriteEstablishments } from '../../database/schema/favorite_establishments.schema';
import { establishments } from '../../database/schema/establishments.schema';
import { User, UpdateUserInput, FavoriteWithDetails } from './types/users.type';

export const getUserById = async (userId: string): Promise<User | null> => {
  const result = await db.select().from(users).where(eq(users.id, userId));

  if (!result || result.length === 0) {
    return null;
  }

  return result[0];
};

export const updateUser = async (
  userId: string,
  updateData: UpdateUserInput
): Promise<User | null> => {
  const updatedUser = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();

  if (!updatedUser || updatedUser.length === 0) {
    return null;
  }

  return updatedUser[0];
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

export const getFavorites = async (userId: string): Promise<FavoriteWithDetails[]> => {
  const result = await db
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
    .where(eq(favoriteEstablishments.userId, userId));

  return result.map(r => ({
    ...r.favorite,
    establishment: r.establishment,
  }));
};
