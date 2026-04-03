import { ExpressHandler } from '../../shared/types/express.type';
import * as productService from './products.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export const createProduct: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
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

export const getProducts: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
    const { type, page, limit } = req.query;
    const filterType = type === 'Private' ? 'Private' : 'All';

    const pagination = page && limit ? { page: Number(page), limit: Number(limit) } : undefined;

    const { products, total } = await productService.getProducts(
      establishment.boundTo,
      filterType,
      pagination
    );

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

export const updateProduct: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
    const { id } = req.params;
    const { name, picture, weight, description, recommendedPrice, typeIds, allergenIds, boundTo } =
      req.body;

    const existingProduct = await productService.getProductById(id!);

    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Only owner can edit
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

export const deleteProduct: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
    const { id } = req.params;

    const existingProduct = await productService.getProductById(id!);

    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Only owner can delete
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
