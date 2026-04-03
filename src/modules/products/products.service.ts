import { db } from '../../database';
import { products } from '../../database/schema/products.schema';
import { productTypes } from '../../database/schema/product_types.schema';
import { productAllergens } from '../../database/schema/product_allergens.schema';
import { typesOfProducts } from '../../database/schema/types_of_products.schema';
import { typesOfAllergens } from '../../database/schema/types_of_allergens.schema';
import { eq, or, inArray, InferSelectModel, count } from 'drizzle-orm';
import { Product, CreateProductInput, UpdateProductInput } from './types/products.type';
import { PaginationParams } from '../../shared/types/pagination.type';

type RawProduct = InferSelectModel<typeof products>;

export const createProduct = async (data: CreateProductInput): Promise<Product> => {
  return await db.transaction(async tx => {
    const { typeIds, allergenIds, ...productData } = data;

    const [product] = await tx.insert(products).values(productData).returning();

    if (typeIds && typeIds.length > 0) {
      await tx.insert(productTypes).values(
        typeIds.map(typeId => ({
          idProduct: product.id,
          idType: typeId,
        }))
      );
    }

    if (allergenIds && allergenIds.length > 0) {
      await tx.insert(productAllergens).values(
        allergenIds.map(allergenId => ({
          idProduct: product.id,
          idAllergen: allergenId,
        }))
      );
    }

    return {
      id: product.id,
      name: product.name,
      picture: product.picture,
      boundTo: product.boundTo,
      weight: product.weight,
      description: product.description,
      recommendedPrice: product.recommendedPrice,
      createdAt: product.createdAt,
      types: typeIds || [],
      allergens: allergenIds || [],
    };
  });
};

const attachTypesAndAllergens = async (productList: RawProduct[]): Promise<Product[]> => {
  if (productList.length === 0) return [];

  const productIds = productList.map(p => p.id);

  const types = await db
    .select({
      productId: productTypes.idProduct,
      typeName: typesOfProducts.name,
    })
    .from(productTypes)
    .innerJoin(typesOfProducts, eq(productTypes.idType, typesOfProducts.id))
    .where(inArray(productTypes.idProduct, productIds));

  const allergens = await db
    .select({
      productId: productAllergens.idProduct,
      allergenName: typesOfAllergens.name,
    })
    .from(productAllergens)
    .innerJoin(typesOfAllergens, eq(productAllergens.idAllergen, typesOfAllergens.id))
    .where(inArray(productAllergens.idProduct, productIds));

  return productList.map(product => ({
    id: product.id,
    name: product.name,
    picture: product.picture,
    boundTo: product.boundTo,
    weight: product.weight,
    description: product.description,
    recommendedPrice: product.recommendedPrice,
    createdAt: product.createdAt,
    types: types.filter(t => t.productId === product.id).map(t => t.typeName),
    allergens: allergens.filter(a => a.productId === product.id).map(a => a.allergenName),
  }));
};

export const getProducts = async (
  establishmentBoundTo: string,
  filterType: 'Private' | 'All' = 'All',
  pagination?: PaginationParams
): Promise<{ products: Product[]; total: number }> => {
  const whereClause =
    filterType === 'Private'
      ? eq(products.boundTo, establishmentBoundTo)
      : or(eq(products.boundTo, establishmentBoundTo), eq(products.boundTo, '0'));

  const totalCountResult = await db.select({ count: count() }).from(products).where(whereClause);
  const total = totalCountResult[0]?.count || 0;

  let query = db.select().from(products).where(whereClause);

  if (pagination?.limit !== undefined && pagination?.page !== undefined) {
    const limit = Number(pagination.limit);
    const offset = (Number(pagination.page) - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
  }

  const productList = await query;
  const attachedProducts = await attachTypesAndAllergens(productList);

  return { products: attachedProducts, total };
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return null;

  const results = await attachTypesAndAllergens([product]);
  return results[0];
};

export const updateProduct = async (
  id: string,
  data: UpdateProductInput
): Promise<Product | null> => {
  return await db.transaction(async tx => {
    const { typeIds, allergenIds, ...productData } = data;

    if (Object.keys(productData).length > 0) {
      await tx.update(products).set(productData).where(eq(products.id, id));
    }

    if (typeIds !== undefined) {
      await tx.delete(productTypes).where(eq(productTypes.idProduct, id));
      if (typeIds.length > 0) {
        await tx.insert(productTypes).values(
          typeIds.map(typeId => ({
            idProduct: id,
            idType: typeId,
          }))
        );
      }
    }

    if (allergenIds !== undefined) {
      await tx.delete(productAllergens).where(eq(productAllergens.idProduct, id));
      if (allergenIds.length > 0) {
        await tx.insert(productAllergens).values(
          allergenIds.map(allergenId => ({
            idProduct: id,
            idAllergen: allergenId,
          }))
        );
      }
    }

    return getProductById(id);
  });
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const result = await db.delete(products).where(eq(products.id, id)).returning();
  return result.length > 0;
};
