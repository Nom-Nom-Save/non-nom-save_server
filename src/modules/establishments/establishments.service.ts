import { eq, like, sql } from 'drizzle-orm';
import { db } from '../../database';
import { establishments } from '../../database/schema/establishments.schema';
import {
  Establishment,
  UpdateEstablishmentInput,
  PublicEstablishment,
} from './types/establishments.type';
import NodeGeocoder from 'node-geocoder';

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

export const getAllEstablishments = async (): Promise<PublicEstablishment[]> => {
  return (await db.select(publicFields).from(establishments)) as PublicEstablishment[];
};

export const getEstablishmentsByCity = async (city: string): Promise<PublicEstablishment[]> => {
  return (await db
    .select(publicFields)
    .from(establishments)
    .where(like(establishments.address, `%${city}%`))) as PublicEstablishment[];
};

export const getEstablishmentsByRadius = async (
  lat: number,
  lon: number,
  radiusKm: number
): Promise<PublicEstablishment[]> => {
  const distanceSql = sql`6371 * acos(
    cos(radians(${lat})) * cos(radians(latitude)) * 
    cos(radians(longitude) - radians(${lon})) + 
    sin(radians(${lat})) * sin(radians(latitude))
  )`;

  return (await db
    .select(publicFields)
    .from(establishments)
    .where(sql`${distanceSql} <= ${radiusKm}`)) as PublicEstablishment[];
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
): Promise<PublicEstablishment | null> => {
  const result = (await db
    .select(publicFields)
    .from(establishments)
    .where(eq(establishments.id, establishmentId))) as PublicEstablishment[];

  if (!result || result.length === 0) {
    return null;
  }

  return result[0];
};

export const getEstablishmentByIdPrivate = async (
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
