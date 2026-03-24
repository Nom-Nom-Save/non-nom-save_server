import { eq, like } from 'drizzle-orm';
import { db } from '../../database';
import { establishments } from '../../database/schema/establishments.schema';
import { Establishment, UpdateEstablishmentInput } from './types/establishments.type';
import NodeGeocoder from 'node-geocoder';

export const getAllEstablishments = async (): Promise<Establishment[]> => {
  return await db.select().from(establishments);
};

export const getEstablishmentsByCity = async (city: string): Promise<Establishment[]> => {
  return await db
    .select()
    .from(establishments)
    .where(like(establishments.address, `%${city}%`));
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
