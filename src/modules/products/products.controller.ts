import { Response } from 'express';
import * as productService from './products.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const establishment = req.establishment!;
    const { name, picture, weight, description, recommendedPrice, typeIds, allergenIds, boundTo } =
      req.body;

    if (!name) {
      res.status(400).json({ message: 'Product name is required' });
      return;
    }

    const product = await productService.createProduct({
      name,
      picture,
      weight,
      description,
      recommendedPrice,
      boundTo: boundTo || establishment.boundTo,
      typeIds,
      allergenIds,
    });

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const establishment = req.establishment!;
    const { type, page, limit } = req.query;
    const filterType = type === 'Private' ? 'Private' : 'All';

    const pagination = page && limit ? { page: Number(page), limit: Number(limit) } : undefined;

    const { products, total } = await productService.getProducts({
      establishmentBoundTo: establishment.boundTo,
      filterType,
      pagination,
    });

    if (pagination) {
      res.status(200).json({
        products,
        meta: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        },
      });
    } else {
      res.status(200).json({ products });
    }
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const establishment = req.establishment!;
    const { id } = req.params;
    const { name, picture, weight, description, recommendedPrice, typeIds, allergenIds, boundTo } =
      req.body;

    const existingProduct = await productService.getProductById(id!);

    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (existingProduct.boundTo !== establishment.boundTo) {
      res.status(403).json({ message: 'Forbidden: You can only edit your own products' });
      return;
    }

    const updated = await productService.updateProduct(id!, {
      name,
      picture,
      weight,
      description,
      recommendedPrice,
      boundTo,
      typeIds,
      allergenIds,
    });

    res.status(200).json({ message: 'Product updated successfully', product: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const establishment = req.establishment!;
    const { id } = req.params;

    const existingProduct = await productService.getProductById(id!);

    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (existingProduct.boundTo !== establishment.boundTo) {
      res.status(403).json({ message: 'Forbidden: You can only delete your own products' });
      return;
    }

    await productService.deleteProduct(id!);

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
