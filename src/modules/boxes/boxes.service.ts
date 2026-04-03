import { db } from '../../database';
import { boxes } from '../../database/schema/boxes.schema';
import { typeBoxes } from '../../database/schema/type_boxes.schema';
import { boxItems } from '../../database/schema/box_items.schema';
import { typesOfProducts } from '../../database/schema/types_of_products.schema';
import { products } from '../../database/schema/products.schema';
import { eq, or, inArray, InferSelectModel, count } from 'drizzle-orm';
import { Box, CreateBoxInput, UpdateBoxInput } from './types/boxes.type';
import { PaginationParams } from '../../shared/types/pagination.type';

type RawBox = InferSelectModel<typeof boxes>;

export const createBox = async (data: CreateBoxInput): Promise<Box> => {
  return await db.transaction(async tx => {
    const { typeIds, productIds, ...boxData } = data;

    let minWeight: number | null = null;
    let maxWeight: number | null = null;

    if (productIds && productIds.length > 0) {
      const productList = await tx
        .select({ weight: products.weight })
        .from(products)
        .where(inArray(products.id, productIds));

      const weights = productList.map(p => p.weight).filter((w): w is number => w !== null);

      if (weights.length > 0) {
        minWeight = Math.min(...weights) * boxData.quantityOfItems;
        maxWeight = Math.max(...weights) * boxData.quantityOfItems;
      }
    }

    const [box] = await tx
      .insert(boxes)
      .values({
        ...boxData,
        minWeight,
        maxWeight,
      })
      .returning();

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
      picture: box.picture,
      boundTo: box.boundTo,
      description: box.description,
      recommendedPrice: box.recommendedPrice,
      minWeight: box.minWeight,
      maxWeight: box.maxWeight,
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
    picture: box.picture,
    boundTo: box.boundTo,
    description: box.description,
    recommendedPrice: box.recommendedPrice,
    minWeight: box.minWeight,
    maxWeight: box.maxWeight,
    createdAt: box.createdAt,
    quantityOfItems: box.quantityOfItems,
    types: types.filter(t => t.boxId === box.id).map(t => t.typeName),
    products: boxProducts.filter(p => p.boxId === box.id).map(p => p.productName),
  }));
};

export const getBoxes = async (
  establishmentBoundTo: string,
  filterType: 'Private' | 'All' = 'All',
  pagination?: PaginationParams
): Promise<{ boxes: Box[]; total: number }> => {
  const whereClause =
    filterType === 'Private'
      ? eq(boxes.boundTo, establishmentBoundTo)
      : or(eq(boxes.boundTo, establishmentBoundTo), eq(boxes.boundTo, '0'));

  const totalCountResult = await db.select({ count: count() }).from(boxes).where(whereClause);
  const total = totalCountResult[0]?.count || 0;

  let query = db.select().from(boxes).where(whereClause);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const boxList = await query;
  const attachedBoxes = await attachTypesAndProducts(boxList);

  return { boxes: attachedBoxes, total };
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

    if (productIds !== undefined || boxData.quantityOfItems !== undefined) {
      const [existingBox] = await tx.select().from(boxes).where(eq(boxes.id, id));
      if (existingBox) {
        const currentProductIds =
          productIds !== undefined
            ? productIds
            : (
                await tx
                  .select({ id: boxItems.productId })
                  .from(boxItems)
                  .where(eq(boxItems.boxId, id))
              ).map(p => p.id);

        const currentQuantity =
          boxData.quantityOfItems !== undefined
            ? boxData.quantityOfItems
            : existingBox.quantityOfItems;

        let minWeight: number | null = null;
        let maxWeight: number | null = null;

        if (currentProductIds.length > 0) {
          const productList = await tx
            .select({ weight: products.weight })
            .from(products)
            .where(inArray(products.id, currentProductIds));

          const weights = productList.map(p => p.weight).filter((w): w is number => w !== null);

          if (weights.length > 0) {
            minWeight = Math.min(...weights) * currentQuantity;
            maxWeight = Math.max(...weights) * currentQuantity;
          }
        }

        (boxData as any).minWeight = minWeight;
        (boxData as any).maxWeight = maxWeight;
      }
    }

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
