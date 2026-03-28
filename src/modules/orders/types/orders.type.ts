import { orders } from '../../../database/schema/orders.schema';
import { ordersDetails } from '../../../database/schema/orders_details.schema';
import { InferSelectModel } from 'drizzle-orm';

export type Order = InferSelectModel<typeof orders>;
export type OrderDetail = InferSelectModel<typeof ordersDetails>;

export type CreateOrderInput = {
  items: {
    menuPriceId: string;
    quantity: number;
  }[];
};

export type OrderStatus = 'Reserved' | 'Completed' | 'Cancelled' | 'Expired';

export type OrderWithDetails = Order & {
  details: (OrderDetail & {
    itemName: string;
    itemType: string;
    price: number;
    originalPrice: number;
    discountPrice: number | null;
    weight?: number | null;
    minWeight?: number | null;
    maxWeight?: number | null;
  })[];
  establishmentName?: string;
  establishmentAddress?: string | null;
  establishmentLogo?: string | null;
  establishmentBanner?: string | null;
  allergens?: string[];
  totalOrderWeight?: number;
};
