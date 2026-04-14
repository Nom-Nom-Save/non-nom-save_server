import { ExpressHandler } from '../../shared/types/express.type';
import * as metadataService from './metadata.service';
import { PaginationParams } from '../../shared/types/pagination.type';

export const getProductTypes: ExpressHandler = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const pagination: Required<PaginationParams> = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };

    const { productTypes, total } = await metadataService.getAllProductTypes(pagination);

    res.status(200).json({
      productTypes,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error: unknown) {
    console.error('Error getting product types:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllergens: ExpressHandler = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const pagination: Required<PaginationParams> = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };

    const { allergens, total } = await metadataService.getAllAllergens(pagination);

    res.status(200).json({
      allergens,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error: unknown) {
    console.error('Error getting allergens:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
