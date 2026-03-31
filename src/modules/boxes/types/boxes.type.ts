import { boxes } from '../../../database/schema/boxes.schema';
import { InferSelectModel } from 'drizzle-orm';

export type Box = InferSelectModel<typeof boxes> & {
  types?: string[];
  products?: string[];
};

export type CreateBoxInput = {
  name: string;
  picture?: string;
  description?: string;
  recommendedPrice?: number;
  quantityOfItems: number;
  boundTo: string;
  typeIds?: string[];
  productIds?: string[];
};

export type UpdateBoxInput = Partial<CreateBoxInput>;
