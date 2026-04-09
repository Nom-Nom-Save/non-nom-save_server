import { orders } from '../../../database/schema/orders.schema';
import { ordersDetails } from '../../../database/schema/orders_details.schema';
import { InferSelectModel } from 'drizzle-orm';
import { UserType } from '../../auth/types/auth.types';

export type Order = InferSelectModel<typeof orders>;
export type OrderDetail = InferSelectModel<typeof ordersDetails>;

export type CreateOrderInput = {
  items: {
    menuPriceId: string;
    quantity: number;
  }[];
};

export const OrderStatusConst = {
  RESERVED: 'Reserved',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
} as const;

export type OrderStatus = (typeof OrderStatusConst)[keyof typeof OrderStatusConst];

export type OrderWithDetails = Order & {
  details: (OrderDetail & {
    itemName: string;
    itemType: string;
    itemPicture: string | null;
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

export type GetOrderParams = {
  orderId: string;
  userOrEstablishmentId: string;
  role: UserType;
};

export type UpdateOrderStatusParams = {
  orderId: string;
  status: OrderStatus;
  establishmentId: string;
};
