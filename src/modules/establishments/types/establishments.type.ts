import { establishments } from '../../../database/schema/establishments.schema';
import { InferSelectModel } from 'drizzle-orm';

export type Establishment = InferSelectModel<typeof establishments>;

export type UpdateEstablishmentInput = Partial<{
  name: string | null;
  email: string;
  description: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  workingHours: string | null;
  boundTo: string;
}>;
