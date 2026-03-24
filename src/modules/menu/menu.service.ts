import { db } from '../../database';
import { menu } from '../../database/schema/menu.schema';
import { menuPrices } from '../../database/schema/menu_prices.schema';
import { products } from '../../database/schema/products.schema';
import { boxes } from '../../database/schema/boxes.schema';
import { boxItems } from '../../database/schema/box_items.schema';
import { productTypes } from '../../database/schema/product_types.schema';
import { productAllergens } from '../../database/schema/product_allergens.schema';
import { typeBoxes } from '../../database/schema/type_boxes.schema';
import { typesOfProducts } from '../../database/schema/types_of_products.schema';
import { typesOfAllergens } from '../../database/schema/types_of_allergens.schema';
import { establishments } from '../../database/schema/establishments.schema';
import { eq, and, or, inArray } from 'drizzle-orm';
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

const fetchItemDetails = async (itemId: string, itemType: string) => {
  const table = itemType === 'Product' ? products : boxes;
  const [details] = await db
    .select({ name: table.name, description: table.description })
    .from(table)
    .where(eq(table.id, itemId));

  if (!details) return null;

  let types: string[] = [];
  let allergens: string[] = [];

  if (itemType === 'Product') {
    const typeResults = await db
      .select({ name: typesOfProducts.name })
      .from(productTypes)
      .innerJoin(typesOfProducts, eq(productTypes.idType, typesOfProducts.id))
      .where(eq(productTypes.idProduct, itemId));
    types = typeResults.map(t => t.name);

    const allergenResults = await db
      .select({ name: typesOfAllergens.name })
      .from(productAllergens)
      .innerJoin(typesOfAllergens, eq(productAllergens.idAllergen, typesOfAllergens.id))
      .where(eq(productAllergens.idProduct, itemId));
    allergens = allergenResults.map(a => a.name);
  } else {
    const boxTypeResults = await db
      .select({ name: typesOfProducts.name })
      .from(typeBoxes)
      .innerJoin(typesOfProducts, eq(typeBoxes.typeId, typesOfProducts.id))
      .where(eq(typeBoxes.boxId, itemId));
    const boxSpecificTypes = boxTypeResults.map(t => t.name);

    const productsInBox = await db
      .select({ productId: boxItems.productId })
      .from(boxItems)
      .where(eq(boxItems.boxId, itemId));

    if (productsInBox.length > 0) {
      const productIds = productsInBox.map(p => p.productId);

      const productTypeResults = await db
        .selectDistinct({ name: typesOfProducts.name })
        .from(productTypes)
        .innerJoin(typesOfProducts, eq(productTypes.idType, typesOfProducts.id))
        .where(inArray(productTypes.idProduct, productIds));

      const productAllergenResults = await db
        .selectDistinct({ name: typesOfAllergens.name })
        .from(productAllergens)
        .innerJoin(typesOfAllergens, eq(productAllergens.idAllergen, typesOfAllergens.id))
        .where(inArray(productAllergens.idProduct, productIds));

      types = Array.from(new Set([...boxSpecificTypes, ...productTypeResults.map(t => t.name)]));
      allergens = productAllergenResults.map(a => a.name);
    } else {
      types = boxSpecificTypes;
    }
  }

  return {
    ...details,
    types,
    allergens: allergens.length > 0 ? allergens : undefined,
  };
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
    const details = await fetchItemDetails(row.menu.itemId, row.menu.itemType);

    result.push({
      ...row.menu,
      priceData: row.menu_prices,
      itemDetails: details,
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
    const details = await fetchItemDetails(row.menu.itemId, row.menu.itemType);

    result.push({
      ...row.menu,
      priceData: row.menu_prices,
      itemDetails: details,
    });
  }

  return result;
};

export const getMenuItemById = async (menuId: string): Promise<MenuWithPrice | null> => {
  const [row] = await db
    .select()
    .from(menu)
    .where(eq(menu.id, menuId))
    .innerJoin(menuPrices, eq(menu.id, menuPrices.menuItemId));

  if (!row) return null;

  const details = await fetchItemDetails(row.menu.itemId, row.menu.itemType);

  return {
    ...row.menu,
    priceData: row.menu_prices,
    itemDetails: details,
  };
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
