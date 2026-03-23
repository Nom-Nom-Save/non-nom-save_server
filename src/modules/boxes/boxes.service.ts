import { db } from '../../database';
import { boxes } from '../../database/schema/boxes.schema';
import { typeBoxes } from '../../database/schema/type_boxes.schema';
import { boxItems } from '../../database/schema/box_items.schema';
import { typesOfProducts } from '../../database/schema/types_of_products.schema';
import { products } from '../../database/schema/products.schema';
import { eq, or, inArray, InferSelectModel } from 'drizzle-orm';
import { Box, CreateBoxInput, UpdateBoxInput } from './types/boxes.type';

type RawBox = InferSelectModel<typeof boxes>;

export const createBox = async (data: CreateBoxInput): Promise<Box> => {
  return await db.transaction(async tx => {
    const { typeIds, productIds, ...boxData } = data;

    const [box] = await tx.insert(boxes).values(boxData).returning();

    if (typeIds && typeIds.length > 0) {
      await tx.insert(typeBoxes).values(
        typeIds.map(typeId => ({
          boxId: box.id,
          typeId: typeId,
        }))
      );
    }

    if (productIds && productIds.length > 0) {
      await tx.insert(boxItems).values(
        productIds.map(productId => ({
          boxId: box.id,
          productId: productId,
        }))
      );
    }

    return {
      id: box.id,
      name: box.name,
      boundTo: box.boundTo,
      description: box.description,
      recommendedPrice: box.recommendedPrice,
      createdAt: box.createdAt,
      quantityOfItems: box.quantityOfItems,
      types: typeIds || [],
      products: productIds || [],
    };
  });
};

const attachTypesAndProducts = async (boxList: RawBox[]): Promise<Box[]> => {
  if (boxList.length === 0) return [];

  const boxIds = boxList.map(b => b.id);

  // Fetch types
  const types = await db
    .select({
      boxId: typeBoxes.boxId,
      typeName: typesOfProducts.name,
    })
    .from(typeBoxes)
    .innerJoin(typesOfProducts, eq(typeBoxes.typeId, typesOfProducts.id))
    .where(inArray(typeBoxes.boxId, boxIds));

  // Fetch products
  const boxProducts = await db
    .select({
      boxId: boxItems.boxId,
      productName: products.name,
    })
    .from(boxItems)
    .innerJoin(products, eq(boxItems.productId, products.id))
    .where(inArray(boxItems.boxId, boxIds));

  return boxList.map(box => ({
    id: box.id,
    name: box.name,
    boundTo: box.boundTo,
    description: box.description,
    recommendedPrice: box.recommendedPrice,
    createdAt: box.createdAt,
    quantityOfItems: box.quantityOfItems,
    types: types.filter(t => t.boxId === box.id).map(t => t.typeName),
    products: boxProducts.filter(p => p.boxId === box.id).map(p => p.productName),
  }));
};

export const getBoxes = async (
  establishmentBoundTo: string,
  filterType: 'Private' | 'All' = 'All'
): Promise<Box[]> => {
  const baseQuery = db.select().from(boxes);

  let boxList: RawBox[];
  if (filterType === 'Private') {
    boxList = await baseQuery.where(eq(boxes.boundTo, establishmentBoundTo));
  } else {
    boxList = await baseQuery.where(
      or(eq(boxes.boundTo, establishmentBoundTo), eq(boxes.boundTo, '0'))
    );
  }

  return attachTypesAndProducts(boxList);
};

export const getBoxById = async (id: string): Promise<Box | null> => {
  const [box] = await db.select().from(boxes).where(eq(boxes.id, id));
  if (!box) return null;

  const results = await attachTypesAndProducts([box]);
  return results[0];
};

export const updateBox = async (id: string, data: UpdateBoxInput): Promise<Box | null> => {
  return await db.transaction(async tx => {
    const { typeIds, productIds, ...boxData } = data;

    if (Object.keys(boxData).length > 0) {
      await tx.update(boxes).set(boxData).where(eq(boxes.id, id));
    }

    if (typeIds !== undefined) {
      await tx.delete(typeBoxes).where(eq(typeBoxes.boxId, id));
      if (typeIds.length > 0) {
        await tx.insert(typeBoxes).values(
          typeIds.map(typeId => ({
            boxId: id,
            typeId: typeId,
          }))
        );
      }
    }

    if (productIds !== undefined) {
      await tx.delete(boxItems).where(eq(boxItems.boxId, id));
      if (productIds.length > 0) {
        await tx.insert(boxItems).values(
          productIds.map(productId => ({
            boxId: id,
            productId: productId,
          }))
        );
      }
    }

    return getBoxById(id);
  });
};

export const deleteBox = async (id: string): Promise<boolean> => {
  const result = await db.delete(boxes).where(eq(boxes.id, id)).returning();
  return result.length > 0;
};
