import { db } from '../../database';
import { orders } from '../../database/schema/orders.schema';
import { ordersDetails } from '../../database/schema/orders_details.schema';
import { menuPrices } from '../../database/schema/menu_prices.schema';
import { menu } from '../../database/schema/menu.schema';
import { establishments } from '../../database/schema/establishments.schema';
import { products } from '../../database/schema/products.schema';
import { boxes } from '../../database/schema/boxes.schema';
import { eq, inArray, sql, and } from 'drizzle-orm';
import { CreateOrderInput, OrderWithDetails } from './types/orders.type';

export const createOrder = async (userId: string, input: CreateOrderInput) => {
  return await db.transaction(async tx => {
    const menuPriceIds = input.items.map(i => i.menuPriceId);

    const itemsData = await tx
      .select({
        menuPrice: menuPrices,
        menuItem: menu,
        establishmentId: menu.establishmentId,
      })
      .from(menuPrices)
      .innerJoin(menu, eq(menuPrices.menuItemId, menu.id))
      .where(inArray(menuPrices.id, menuPriceIds));

    if (itemsData.length !== input.items.length) {
      throw new Error('One or more items not found in menu');
    }

    const establishmentId = itemsData[0].establishmentId;
    const sameEstablishment = itemsData.every(item => item.establishmentId === establishmentId);
    if (!sameEstablishment) {
      throw new Error('All items in an order must be from the same establishment');
    }

    let totalPrice = 0;
    for (const item of input.items) {
      const dbItem = itemsData.find(d => d.menuPrice.id === item.menuPriceId);
      if (!dbItem) continue;

      if (dbItem.menuPrice.availableQuantity < item.quantity) {
        throw new Error(`Not enough quantity for item ${dbItem.menuItem.id}`);
      }

      const price = dbItem.menuPrice.discountPrice || dbItem.menuPrice.originalPrice;
      totalPrice += price * item.quantity;
    }

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const [newOrder] = await tx
      .insert(orders)
      .values({
        userId,
        totalPrice,
        orderStatus: 'Reserved',
        reservedAt: new Date(),
        expiresAt,
        qrCodeData: `ORDER-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      })
      .returning();

    for (const item of input.items) {
      const dbItem = itemsData.find(d => d.menuPrice.id === item.menuPriceId);
      if (!dbItem) continue;

      const unitPrice = dbItem.menuPrice.discountPrice || dbItem.menuPrice.originalPrice;

      await tx.insert(ordersDetails).values({
        orderId: newOrder.id,
        menuPriceId: item.menuPriceId,
        quantity: item.quantity,
        price: unitPrice,
      });

      const [updatedPrice] = await tx
        .update(menuPrices)
        .set({
          availableQuantity: sql`${menuPrices.availableQuantity} - ${item.quantity}`,
        })
        .where(eq(menuPrices.id, item.menuPriceId))
        .returning();

      if (updatedPrice.availableQuantity === 0) {
        await tx
          .update(menu)
          .set({ status: 'SoldOut' })
          .where(eq(menu.id, updatedPrice.menuItemId));
      }
    }

    return newOrder;
  });
};

export const getUserOrders = async (userId: string): Promise<OrderWithDetails[]> => {
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(sql`${orders.reservedAt} DESC`);

  const results: OrderWithDetails[] = [];

  for (const order of userOrders) {
    const details = await db
      .select({
        detail: ordersDetails,
        menuPrice: menuPrices,
        menuItem: menu,
      })
      .from(ordersDetails)
      .innerJoin(menuPrices, eq(ordersDetails.menuPriceId, menuPrices.id))
      .innerJoin(menu, eq(menuPrices.menuItemId, menu.id))
      .where(eq(ordersDetails.orderId, order.id));

    const detailsWithNames = await Promise.all(
      details.map(async d => {
        let itemName = 'Unknown';
        if (d.menuItem.itemType === 'Product') {
          const [p] = await db.select().from(products).where(eq(products.id, d.menuItem.itemId));
          itemName = p?.name || 'Unknown Product';
        } else {
          const [b] = await db.select().from(boxes).where(eq(boxes.id, d.menuItem.itemId));
          itemName = b?.name || 'Unknown Box';
        }

        return {
          ...d.detail,
          itemName,
          itemType: d.menuItem.itemType,
          price: d.detail.price,
        };
      })
    );

    const [est] = await db
      .select({ name: establishments.name })
      .from(establishments)
      .where(eq(establishments.id, details[0]?.menuItem.establishmentId));

    results.push({
      ...order,
      details: detailsWithNames,
      establishmentName: est?.name || 'Unknown Establishment',
    });
  }

  return results;
};

export const getEstablishmentOrders = async (
  establishmentId: string
): Promise<OrderWithDetails[]> => {
  const establishmentOrders = await db
    .selectDistinct({ order: orders })
    .from(orders)
    .innerJoin(ordersDetails, eq(orders.id, ordersDetails.orderId))
    .innerJoin(menuPrices, eq(ordersDetails.menuPriceId, menuPrices.id))
    .innerJoin(menu, eq(menuPrices.menuItemId, menu.id))
    .where(eq(menu.establishmentId, establishmentId))
    .orderBy(sql`${orders.reservedAt} DESC`);

  const results: OrderWithDetails[] = [];

  for (const row of establishmentOrders) {
    const order = row.order;
    const details = await db
      .select({
        detail: ordersDetails,
        menuPrice: menuPrices,
        menuItem: menu,
      })
      .from(ordersDetails)
      .innerJoin(menuPrices, eq(ordersDetails.menuPriceId, menuPrices.id))
      .innerJoin(menu, eq(menuPrices.menuItemId, menu.id))
      .where(eq(ordersDetails.orderId, order.id));

    const detailsWithNames = await Promise.all(
      details.map(async d => {
        let itemName = 'Unknown';
        if (d.menuItem.itemType === 'Product') {
          const [p] = await db.select().from(products).where(eq(products.id, d.menuItem.itemId));
          itemName = p?.name || 'Unknown Product';
        } else {
          const [b] = await db.select().from(boxes).where(eq(boxes.id, d.menuItem.itemId));
          itemName = b?.name || 'Unknown Box';
        }

        return {
          ...d.detail,
          itemName,
          itemType: d.menuItem.itemType,
          price: d.detail.price,
        };
      })
    );

    results.push({
      ...order,
      details: detailsWithNames,
    });
  }

  return results;
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
  establishmentId: string
) => {
  const [orderCheck] = await db
    .select()
    .from(orders)
    .innerJoin(ordersDetails, eq(orders.id, ordersDetails.orderId))
    .innerJoin(menuPrices, eq(ordersDetails.menuPriceId, menuPrices.id))
    .innerJoin(menu, eq(menuPrices.menuItemId, menu.id))
    .where(and(eq(orders.id, orderId), eq(menu.establishmentId, establishmentId)));

  if (!orderCheck) {
    throw new Error('Order not found or unauthorized');
  }

  const [updatedOrder] = await db
    .update(orders)
    .set({
      orderStatus: status,
      completedAt: status === 'Completed' ? new Date() : null,
    })
    .where(eq(orders.id, orderId))
    .returning();

  return updatedOrder;
};

export const getOrderById = async (
  orderId: string,
  userOrEstablishmentId: string,
  role: 'user' | 'establishment'
): Promise<OrderWithDetails | null> => {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

  if (!order) return null;

  const details = await db
    .select({
      detail: ordersDetails,
      menuPrice: menuPrices,
      menuItem: menu,
    })
    .from(ordersDetails)
    .innerJoin(menuPrices, eq(ordersDetails.menuPriceId, menuPrices.id))
    .innerJoin(menu, eq(menuPrices.menuItemId, menu.id))
    .where(eq(ordersDetails.orderId, order.id));

  if (details.length === 0) return null;

  // Authorization check
  if (role === 'user' && order.userId !== userOrEstablishmentId) {
    throw new Error('Unauthorized');
  }

  if (role === 'establishment' && details[0].menuItem.establishmentId !== userOrEstablishmentId) {
    throw new Error('Unauthorized');
  }

  const detailsWithNames = await Promise.all(
    details.map(async d => {
      let itemName = 'Unknown';
      if (d.menuItem.itemType === 'Product') {
        const [p] = await db.select().from(products).where(eq(products.id, d.menuItem.itemId));
        itemName = p?.name || 'Unknown Product';
      } else {
        const [b] = await db.select().from(boxes).where(eq(boxes.id, d.menuItem.itemId));
        itemName = b?.name || 'Unknown Box';
      }

      return {
        ...d.detail,
        itemName,
        itemType: d.menuItem.itemType,
        price: d.detail.price,
      };
    })
  );

  const [est] = await db
    .select({ name: establishments.name })
    .from(establishments)
    .where(eq(establishments.id, details[0]?.menuItem.establishmentId));

  return {
    ...order,
    details: detailsWithNames,
    establishmentName: est?.name || 'Unknown Establishment',
  };
};
