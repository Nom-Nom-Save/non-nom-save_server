import { db } from '../../database';
import { orders } from '../../database/schema/orders.schema';
import { ordersDetails } from '../../database/schema/orders_details.schema';
import { menuPrices } from '../../database/schema/menu_prices.schema';
import { menu } from '../../database/schema/menu.schema';
import { establishments } from '../../database/schema/establishments.schema';
import { products } from '../../database/schema/products.schema';
import { boxes } from '../../database/schema/boxes.schema';
import { productAllergens } from '../../database/schema/product_allergens.schema';
import { typesOfAllergens } from '../../database/schema/types_of_allergens.schema';
import { boxItems } from '../../database/schema/box_items.schema';
import { eq, inArray, sql, and, lt, count } from 'drizzle-orm';
import { CreateOrderInput, OrderWithDetails } from './types/orders.type';
import { PaginationParams } from '../../shared/types/pagination.type';

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

    const [newOrder] = await tx
      .insert(orders)
      .values({
        userId,
        totalPrice,
        orderStatus: 'Reserved',
        reservedAt: sql`timezone('utc', now())`,
        expiresAt: sql`timezone('utc', now()) + interval '2 hours'`,
        qrCodeData: `ORDER-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      })
      .returning();

    for (const item of input.items) {
      const dbItem = itemsData.find(d => d.menuPrice.id === item.menuPriceId);
      if (!dbItem) continue;

      const paidPrice = dbItem.menuPrice.discountPrice || dbItem.menuPrice.originalPrice;

      await tx.insert(ordersDetails).values({
        orderId: newOrder.id,
        menuPriceId: item.menuPriceId,
        quantity: item.quantity,
        price: paidPrice,
        originalPrice: dbItem.menuPrice.originalPrice,
        discountPrice: dbItem.menuPrice.discountPrice,
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

export const getUserOrders = async (
  userId: string,
  pagination?: PaginationParams
): Promise<{ orders: OrderWithDetails[]; total: number }> => {
  const whereClause = eq(orders.userId, userId);

  const totalCountResult = await db.select({ count: count() }).from(orders).where(whereClause);
  const total = totalCountResult[0]?.count || 0;

  let query = db
    .select()
    .from(orders)
    .where(whereClause)
    .orderBy(sql`${orders.reservedAt} DESC`);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const userOrders = await query;

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

    const orderProductIds: string[] = [];
    let totalOrderWeight = 0;
    const detailsWithNames = await Promise.all(
      details.map(async d => {
        let itemName = 'Unknown';
        let itemPicture: string | null = null;
        let weight: number | null = null;
        let minWeight: number | null = null;
        let maxWeight: number | null = null;

        if (d.menuItem.itemType === 'Product') {
          const [p] = await db.select().from(products).where(eq(products.id, d.menuItem.itemId));
          itemName = p?.name || 'Unknown Product';
          itemPicture = p?.picture || null;
          weight = p?.weight;
          if (p?.id) orderProductIds.push(p.id);

          if (weight) {
            totalOrderWeight += weight * d.detail.quantity;
          }
        } else {
          const [b] = await db.select().from(boxes).where(eq(boxes.id, d.menuItem.itemId));
          itemName = b?.name || 'Unknown Box';
          itemPicture = b?.picture || null;
          minWeight = b?.minWeight;
          maxWeight = b?.maxWeight;

          if (b?.id) {
            const productsInBox = await db
              .select({ productId: boxItems.productId })
              .from(boxItems)
              .where(eq(boxItems.boxId, b.id));
            orderProductIds.push(...productsInBox.map(p => p.productId));
          }

          if (minWeight !== null && maxWeight !== null) {
            const averageWeight = (minWeight + maxWeight) / 2;
            totalOrderWeight += averageWeight * d.detail.quantity;
          }
        }

        return {
          ...d.detail,
          itemName,
          itemType: d.menuItem.itemType,
          itemPicture,
          weight,
          minWeight,
          maxWeight,
        };
      })
    );

    let allergens: string[] = [];
    if (orderProductIds.length > 0) {
      const allAllergens = await db
        .select({ name: typesOfAllergens.name })
        .from(productAllergens)
        .innerJoin(typesOfAllergens, eq(productAllergens.idAllergen, typesOfAllergens.id))
        .where(inArray(productAllergens.idProduct, orderProductIds));

      allergens = Array.from(new Set(allAllergens.map(a => a.name)));
    }

    const [est] = await db
      .select({
        name: establishments.name,
        address: establishments.address,
        logo: establishments.logo,
        banner: establishments.banner,
      })
      .from(establishments)
      .where(eq(establishments.id, details[0]?.menuItem.establishmentId));

    results.push({
      ...order,
      details: detailsWithNames,
      establishmentName: est?.name || 'Unknown Establishment',
      establishmentAddress: est?.address,
      establishmentLogo: est?.logo,
      establishmentBanner: est?.banner,
      allergens,
      totalOrderWeight,
    });
  }

  return { orders: results, total };
};

export const getEstablishmentOrders = async (
  establishmentId: string,
  pagination?: PaginationParams
): Promise<{ orders: OrderWithDetails[]; total: number }> => {
  const whereClause = eq(menu.establishmentId, establishmentId);

  const totalCountResult = await db
    .select({ count: count() })
    .from(orders)
    .innerJoin(ordersDetails, eq(orders.id, ordersDetails.orderId))
    .innerJoin(menuPrices, eq(ordersDetails.menuPriceId, menuPrices.id))
    .innerJoin(menu, eq(menuPrices.menuItemId, menu.id))
    .where(whereClause);
  const total = totalCountResult[0]?.count || 0;

  let query = db
    .selectDistinct({ order: orders })
    .from(orders)
    .innerJoin(ordersDetails, eq(orders.id, ordersDetails.orderId))
    .innerJoin(menuPrices, eq(ordersDetails.menuPriceId, menuPrices.id))
    .innerJoin(menu, eq(menuPrices.menuItemId, menu.id))
    .where(whereClause)
    .orderBy(sql`${orders.reservedAt} DESC`);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const establishmentOrders = await query;

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

    const orderProductIds: string[] = [];
    let totalOrderWeight = 0;
    const detailsWithNames = await Promise.all(
      details.map(async d => {
        let itemName = 'Unknown';
        let itemPicture: string | null = null;
        let weight: number | null = null;
        let minWeight: number | null = null;
        let maxWeight: number | null = null;

        if (d.menuItem.itemType === 'Product') {
          const [p] = await db.select().from(products).where(eq(products.id, d.menuItem.itemId));
          itemName = p?.name || 'Unknown Product';
          itemPicture = p?.picture || null;
          weight = p?.weight;
          if (p?.id) orderProductIds.push(p.id);

          if (weight) {
            totalOrderWeight += weight * d.detail.quantity;
          }
        } else {
          const [b] = await db.select().from(boxes).where(eq(boxes.id, d.menuItem.itemId));
          itemName = b?.name || 'Unknown Box';
          itemPicture = b?.picture || null;
          minWeight = b?.minWeight;
          maxWeight = b?.maxWeight;

          if (b?.id) {
            const productsInBox = await db
              .select({ productId: boxItems.productId })
              .from(boxItems)
              .where(eq(boxItems.boxId, b.id));
            orderProductIds.push(...productsInBox.map(p => p.productId));
          }

          if (minWeight !== null && maxWeight !== null) {
            const averageWeight = (minWeight + maxWeight) / 2;
            totalOrderWeight += averageWeight * d.detail.quantity;
          }
        }

        return {
          ...d.detail,
          itemName,
          itemType: d.menuItem.itemType,
          itemPicture,
          weight,
          minWeight,
          maxWeight,
        };
      })
    );

    let allergens: string[] = [];
    if (orderProductIds.length > 0) {
      const allAllergens = await db
        .select({ name: typesOfAllergens.name })
        .from(productAllergens)
        .innerJoin(typesOfAllergens, eq(productAllergens.idAllergen, typesOfAllergens.id))
        .where(inArray(productAllergens.idProduct, Array.from(new Set(orderProductIds))));

      allergens = Array.from(new Set(allAllergens.map(a => a.name)));
    }

    const [est] = await db
      .select({
        name: establishments.name,
        address: establishments.address,
        logo: establishments.logo,
        banner: establishments.banner,
      })
      .from(establishments)
      .where(eq(establishments.id, details[0]?.menuItem.establishmentId));

    results.push({
      ...order,
      details: detailsWithNames,
      establishmentName: est?.name || 'Unknown Establishment',
      establishmentAddress: est?.address,
      establishmentLogo: est?.logo,
      establishmentBanner: est?.banner,
      allergens,
      totalOrderWeight,
    });
  }

  return { orders: results, total };
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

export const cancelOrder = async (orderId: string, userId: string) => {
  return await db.transaction(async tx => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

    if (!order) {
      throw new Error('Order not found or unauthorized');
    }

    if (order.orderStatus === 'Completed') {
      throw new Error('Cannot cancel a completed order');
    }

    if (order.orderStatus === 'Cancelled') {
      throw new Error('Order is already cancelled');
    }

    if (order.orderStatus === 'Expired') {
      throw new Error('Cannot cancel an expired order');
    }

    const [updatedOrder] = await tx
      .update(orders)
      .set({
        orderStatus: 'Cancelled',
        expiresAt: null,
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Return items to stock
    const details = await tx.select().from(ordersDetails).where(eq(ordersDetails.orderId, orderId));

    for (const detail of details) {
      const [updatedPrice] = await tx
        .update(menuPrices)
        .set({
          availableQuantity: sql`${menuPrices.availableQuantity} + ${detail.quantity}`,
        })
        .where(eq(menuPrices.id, detail.menuPriceId))
        .returning();

      if (updatedPrice.availableQuantity > 0) {
        await tx.update(menu).set({ status: 'Active' }).where(eq(menu.id, updatedPrice.menuItemId));
      }
    }

    return updatedOrder;
  });
};

export const updateExpiredOrders = async () => {
  const expiredOrders = await db
    .select()
    .from(orders)
    .where(
      and(eq(orders.orderStatus, 'Reserved'), lt(orders.expiresAt, sql`timezone('utc', now())`))
    );

  for (const order of expiredOrders) {
    await db.transaction(async tx => {
      // Re-verify status inside transaction
      const [currentOrder] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, order.id), eq(orders.orderStatus, 'Reserved')));

      if (!currentOrder) return;

      await tx
        .update(orders)
        .set({
          orderStatus: 'Expired',
          expiresAt: null,
        })
        .where(eq(orders.id, order.id));

      const details = await tx
        .select()
        .from(ordersDetails)
        .where(eq(ordersDetails.orderId, order.id));

      for (const detail of details) {
        const [updatedPrice] = await tx
          .update(menuPrices)
          .set({
            availableQuantity: sql`${menuPrices.availableQuantity} + ${detail.quantity}`,
          })
          .where(eq(menuPrices.id, detail.menuPriceId))
          .returning();

        if (updatedPrice.availableQuantity > 0) {
          await tx
            .update(menu)
            .set({ status: 'Active' })
            .where(eq(menu.id, updatedPrice.menuItemId));
        }
      }
    });
  }

  return expiredOrders.length;
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

  const orderProductIds: string[] = [];
  let totalOrderWeight = 0;
  const detailsWithNames = await Promise.all(
    details.map(async d => {
      let itemName = 'Unknown';
      let itemPicture: string | null = null;
      let weight: number | null = null;
      let minWeight: number | null = null;
      let maxWeight: number | null = null;

      if (d.menuItem.itemType === 'Product') {
        const [p] = await db.select().from(products).where(eq(products.id, d.menuItem.itemId));
        itemName = p?.name || 'Unknown Product';
        itemPicture = p?.picture || null;
        weight = p?.weight;
        if (p?.id) orderProductIds.push(p.id);

        if (weight) {
          totalOrderWeight += weight * d.detail.quantity;
        }
      } else {
        const [b] = await db.select().from(boxes).where(eq(boxes.id, d.menuItem.itemId));
        itemName = b?.name || 'Unknown Box';
        itemPicture = b?.picture || null;
        minWeight = b?.minWeight;
        maxWeight = b?.maxWeight;

        if (b?.id) {
          const productsInBox = await db
            .select({ productId: boxItems.productId })
            .from(boxItems)
            .where(eq(boxItems.boxId, b.id));
          orderProductIds.push(...productsInBox.map(p => p.productId));
        }

        if (minWeight !== null && maxWeight !== null) {
          const averageWeight = (minWeight + maxWeight) / 2;
          totalOrderWeight += averageWeight * d.detail.quantity;
        }
      }

      return {
        ...d.detail,
        itemName,
        itemType: d.menuItem.itemType,
        itemPicture,
        weight,
        minWeight,
        maxWeight,
      };
    })
  );
  let allergens: string[] = [];
  if (orderProductIds.length > 0) {
    const allAllergens = await db
      .select({ name: typesOfAllergens.name })
      .from(productAllergens)
      .innerJoin(typesOfAllergens, eq(productAllergens.idAllergen, typesOfAllergens.id))
      .where(inArray(productAllergens.idProduct, Array.from(new Set(orderProductIds))));

    allergens = Array.from(new Set(allAllergens.map(a => a.name)));
  }

  const [est] = await db
    .select({
      name: establishments.name,
      address: establishments.address,
      logo: establishments.logo,
      banner: establishments.banner,
    })
    .from(establishments)
    .where(eq(establishments.id, details[0]?.menuItem.establishmentId));

  return {
    ...order,
    details: detailsWithNames,
    establishmentName: est?.name || 'Unknown Establishment',
    establishmentAddress: est?.address,
    establishmentLogo: est?.logo,
    establishmentBanner: est?.banner,
    allergens,
    totalOrderWeight,
  };
};
