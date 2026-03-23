import { db } from '../../database';
import { menu } from '../../database/schema/menu.schema';
import { menuPrices } from '../../database/schema/menu_prices.schema';
import { products } from '../../database/schema/products.schema';
import { boxes } from '../../database/schema/boxes.schema';
import { establishments } from '../../database/schema/establishments.schema';
import { eq, and, or } from 'drizzle-orm';
import { AddToMenuInput, MenuStatus, MenuWithPrice } from './types/menu.type';

export const addItemToMenu = async (
  establishmentId: string,
  establishmentBoundTo: string,
  data: AddToMenuInput
): Promise<any> => {
  return await db.transaction(async tx => {
    const table = data.itemType === 'Product' ? products : boxes;

    const [template] = await tx
      .select()
      .from(table)
      .where(
        and(
          eq(table.id, data.itemId),
          or(eq(table.boundTo, '0'), eq(table.boundTo, establishmentBoundTo))
        )
      );

    if (!template) {
      throw new Error(`${data.itemType} template not found or access denied`);
    }

    const [menuEntry] = await tx
      .insert(menu)
      .values({
        establishmentId,
        itemId: data.itemId,
        itemType: data.itemType,
        status: 'Active',
      })
      .returning();

    const [priceEntry] = await tx
      .insert(menuPrices)
      .values({
        menuItemId: menuEntry.id,
        totalQuantity: data.totalQuantity,
        availableQuantity: data.totalQuantity,
        originalPrice: data.originalPrice,
        discountPrice: data.discountPrice,
        startTime: data.startTime,
        endTime: data.endTime,
      })
      .returning();

    return { ...menuEntry, priceData: priceEntry };
  });
};

export const getMenuForEstablishment = async (
  establishmentId: string
): Promise<MenuWithPrice[]> => {
  const menuItems = await db
    .select()
    .from(menu)
    .where(eq(menu.establishmentId, establishmentId))
    .innerJoin(menuPrices, eq(menu.id, menuPrices.menuItemId));

  const result: MenuWithPrice[] = [];

  for (const row of menuItems) {
    const table = row.menu.itemType === 'Product' ? products : boxes;
    const [details] = await db
      .select({ name: table.name, description: table.description })
      .from(table)
      .where(eq(table.id, row.menu.itemId));

    result.push({
      ...row.menu,
      priceData: row.menu_prices,
      itemDetails: details || null,
    });
  }

  return result;
};

export const getPublicMenu = async (establishmentId: string): Promise<MenuWithPrice[]> => {
  const menuItems = await db
    .select()
    .from(menu)
    .where(and(eq(menu.establishmentId, establishmentId), eq(menu.status, 'Active')))
    .innerJoin(menuPrices, eq(menu.id, menuPrices.menuItemId));

  const result: MenuWithPrice[] = [];

  for (const row of menuItems) {
    const table = row.menu.itemType === 'Product' ? products : boxes;
    const [details] = await db
      .select({ name: table.name, description: table.description })
      .from(table)
      .where(eq(table.id, row.menu.itemId));

    result.push({
      ...row.menu,
      priceData: row.menu_prices,
      itemDetails: details || null,
    });
  }

  return result;
};

export const updateMenuStatus = async (
  menuId: string,
  establishmentId: string,
  status: MenuStatus
): Promise<boolean> => {
  const result = await db
    .update(menu)
    .set({ status })
    .where(and(eq(menu.id, menuId), eq(menu.establishmentId, establishmentId)))
    .returning();

  return result.length > 0;
};
