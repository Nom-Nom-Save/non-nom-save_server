import { ExpressHandler } from '../../shared/types/express.type';
import * as metadataService from './metadata.service';

export const getProductTypes: ExpressHandler = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const pagination = page && limit ? { page: Number(page), limit: Number(limit) } : undefined;

    const { productTypes, total } = await metadataService.getAllProductTypes(pagination);

    if (pagination) {
      res.status(200).json({
        productTypes,
        meta: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        },
      });
    } else {
      res.status(200).json({ productTypes });
    }
  } catch (error) {
    console.error('Error getting product types:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllergens: ExpressHandler = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const pagination = page && limit ? { page: Number(page), limit: Number(limit) } : undefined;

    const { allergens, total } = await metadataService.getAllAllergens(pagination);

    if (pagination) {
      res.status(200).json({
        allergens,
        meta: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        },
      });
    } else {
      res.status(200).json({ allergens });
    }
  } catch (error) {
    console.error('Error getting allergens:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
