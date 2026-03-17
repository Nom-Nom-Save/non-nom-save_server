import { eq } from 'drizzle-orm';
import { db } from '../../database';
import { establishments } from '../../database/schema/establishments.schema';
import { Establishment, UpdateEstablishmentInput } from './types/establishments.type';

export const updateEstablishment = async (
  establishmentId: string,
  updateData: UpdateEstablishmentInput
): Promise<Establishment | null> => {
  const updatedEstablishment = await db
    .update(establishments)
    .set(updateData)
    .where(eq(establishments.id, establishmentId))
    .returning();

  if (!updatedEstablishment || updatedEstablishment.length === 0) {
    return null;
  }

  return updatedEstablishment[0];
};

export const getEstablishmentById = async (
  establishmentId: string
): Promise<Establishment | null> => {
  const result = await db
    .select()
    .from(establishments)
    .where(eq(establishments.id, establishmentId));

  if (!result || result.length === 0) {
    return null;
  }

  return result[0];
};
