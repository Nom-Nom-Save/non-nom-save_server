import { boxes } from '../../../database/schema/boxes.schema';
import { InferSelectModel } from 'drizzle-orm';
import { PaginationParams } from '../../../shared/types/pagination.type';

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

export type GetBoxesFilterType = 'Private' | 'All';

export type GetBoxesParams = {
  establishmentBoundTo: string;
  filterType?: GetBoxesFilterType;
  pagination: Required<PaginationParams>;
};
