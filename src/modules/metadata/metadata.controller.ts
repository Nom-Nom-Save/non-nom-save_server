import { ExpressHandler } from '../../shared/types/express.type';
import * as metadataService from './metadata.service';
import { PaginationParams } from '../../shared/types/pagination.type';

interface PaginationQuery {
  page?: string;
  limit?: string;
}

const getPaginationParams = (query: PaginationQuery): PaginationParams | undefined => {
  const { page, limit } = query;
  return page && limit ? { page: Number(page), limit: Number(limit) } : undefined;
};

export const getProductTypes: ExpressHandler = async (req, res) => {
  try {
    const pagination = getPaginationParams(req.query as PaginationQuery);

    const { productTypes, total } = await metadataService.getAllProductTypes(pagination);

    if (pagination && pagination.page !== undefined && pagination.limit !== undefined) {
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
  } catch (error: unknown) {
    console.error('Error getting product types:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllergens: ExpressHandler = async (req, res) => {
  try {
    const pagination = getPaginationParams(req.query as PaginationQuery);

    const { allergens, total } = await metadataService.getAllAllergens(pagination);

    if (pagination && pagination.page !== undefined && pagination.limit !== undefined) {
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
  } catch (error: unknown) {
    console.error('Error getting allergens:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
