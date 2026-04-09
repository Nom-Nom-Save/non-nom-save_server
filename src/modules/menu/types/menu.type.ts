import { menu } from '../../../database/schema/menu.schema';
import { menuPrices } from '../../../database/schema/menu_prices.schema';
import { InferSelectModel } from 'drizzle-orm';

export type MenuItem = InferSelectModel<typeof menu>;
export type MenuItemPrice = InferSelectModel<typeof menuPrices>;

export type AddToMenuInput = {
  itemId: string;
  itemType: 'Product' | 'Box';
  totalQuantity: number;
  originalPrice: number;
  discountPrice?: number;
  startTime?: Date;
  endTime?: Date;
};

export type MenuStatus = 'Active' | 'Inactive' | 'SoldOut';

export type UpdateMenuInput = Partial<Omit<AddToMenuInput, 'itemId' | 'itemType'>>;

export type MenuWithPrice = MenuItem & {
  priceData: MenuItemPrice;
  itemDetails: {
    name: string | null;
    description: string | null;
    picture: string | null;
    weightInfo: string | null;
    types?: string[];
    allergens?: string[];
  } | null;
};

export type AddToMenuParams = {
  establishmentId: string;
  establishmentBoundTo: string;
  data: AddToMenuInput;
};

export type UpdateMenuStatusParams = {
  menuId: string;
  establishmentId: string;
  status: MenuStatus;
};

export type UpdateMenuItemParams = {
  menuId: string;
  establishmentId: string;
  data: UpdateMenuInput;
};
