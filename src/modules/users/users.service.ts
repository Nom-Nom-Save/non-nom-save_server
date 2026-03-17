import { eq } from 'drizzle-orm';
import { db } from '../../database';
import { users } from '../../database/schema/users.schema';
import { User, UpdateUserInput } from './types/users.type';

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
