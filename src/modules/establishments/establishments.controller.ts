import { ExpressHandler } from '../../shared/types/express.type';
import {
  updateEstablishment,
  getEstablishmentById,
  getEstablishmentByIdPrivate,
  getFilteredEstablishments,
  getAllEstablishmentCities,
} from './establishments.service';
import { isFavorite } from '../users/users.service';
import {
  UpdateEstablishmentInput,
  EstablishmentFilterParams,
  EstablishmentSortParams,
  EstablishmentsSortBy,
} from './types/establishments.type';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { UserType } from '../auth/types/auth.types';
import { SortOrder } from '../../shared/types/common.types';
import { PaginationParams } from '../../shared/types/pagination.type';

export const getEstablishmentPrivate: ExpressHandler = async (req, res) => {
  try {
    const establishmentId = (req as AuthenticatedRequest).user?.id;

    if (!establishmentId) {
      res.status(401).json({ error: 'Unauthorized: No establishment ID in token' });
      return;
    }

    const establishment = await getEstablishmentByIdPrivate(establishmentId);

    if (!establishment) {
      res.status(404).json({ error: 'Establishment not found' });
      return;
    }

    res.status(200).json({
      message: 'Establishment profile retrieved successfully',
      establishment,
    });
  } catch (error: unknown) {
    console.error('Error in getEstablishmentPrivate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNearbyEstablishments: ExpressHandler = async (req, res) => {
  try {
    const { lat, lon, radius, page, limit, sortBy, sortOrder, minRating, productTypeIds } =
      req.query;

    if (!lat || !lon || !radius) {
      res.status(400).json({ error: 'lat, lon, and radius are required' });
      return;
    }

    const pagination: Required<PaginationParams> = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };

    const filters: EstablishmentFilterParams = {
      lat: Number(lat),
      lon: Number(lon),
      radius: Number(radius),
      minRating: minRating ? Number(minRating) : undefined,
      productTypeIds:
        typeof productTypeIds === 'string'
          ? productTypeIds.split(',')
          : (productTypeIds as string[]),
    };

    const sorting: EstablishmentSortParams = {
      sortBy: sortBy as EstablishmentsSortBy,
      sortOrder: (sortOrder as SortOrder) ?? SortOrder.DESC,
    };

    const { establishments: nearby, total } = await getFilteredEstablishments({
      filters,
      sorting,
      pagination,
    });

    res.status(200).json({
      message: 'Nearby establishments retrieved successfully',
      establishments: nearby,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error: unknown) {
    console.error('Error in getNearbyEstablishments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEstablishments: ExpressHandler = async (req, res) => {
  try {
    const { city, page, limit, lat, lon, radius, minRating, productTypeIds, sortBy, sortOrder } =
      req.query;

    const pagination: Required<PaginationParams> = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };

    const filters: EstablishmentFilterParams = {
      city: city as string,
      lat: lat ? Number(lat) : undefined,
      lon: lon ? Number(lon) : undefined,
      radius: radius ? Number(radius) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      productTypeIds:
        typeof productTypeIds === 'string'
          ? productTypeIds.split(',')
          : (productTypeIds as string[]),
    };

    const sorting: EstablishmentSortParams = {
      sortBy: sortBy as EstablishmentsSortBy,
      sortOrder: (sortOrder as SortOrder) ?? SortOrder.DESC,
    };

    const { establishments, total } = await getFilteredEstablishments({
      filters,
      sorting,
      pagination,
    });

    res.status(200).json({
      message: 'Establishments retrieved successfully',
      establishments,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error: unknown) {
    console.error('Error in getEstablishments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEstablishmentProfile: ExpressHandler = async (req, res) => {
  try {
    const { establishmentId } = req.params;
    const authenticatedId = (req as AuthenticatedRequest).user?.id;

    if (!establishmentId) {
      res.status(400).json({ error: 'Establishment ID is required' });
      return;
    }

    if (establishmentId !== authenticatedId) {
      res.status(403).json({ error: 'Access denied: You can only edit your own profile' });
      return;
    }

    const updateData: UpdateEstablishmentInput = req.body;

    const existingEstablishment = await getEstablishmentById(establishmentId);
    if (!existingEstablishment) {
      res.status(404).json({ error: 'Establishment not found' });
      return;
    }

    const updated = await updateEstablishment(establishmentId, updateData);

    if (!updated) {
      res.status(500).json({ error: 'Failed to update establishment profile' });
      return;
    }

    res.status(200).json({
      message: 'Establishment profile updated successfully',
      establishment: updated,
    });
  } catch (error: unknown) {
    console.error('Error in updateEstablishmentProfile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEstablishment: ExpressHandler = async (req, res) => {
  try {
    const { establishmentId } = req.params;
    const user = (req as AuthenticatedRequest).user;

    if (!establishmentId) {
      res.status(400).json({ error: 'Establishment ID is required' });
      return;
    }

    const establishment = await getEstablishmentById(establishmentId);

    if (!establishment) {
      res.status(404).json({ error: 'Establishment not found' });
      return;
    }

    let favoriteStatus = false;
    if (user && user.role === UserType.USER) {
      favoriteStatus = await isFavorite(user.id, establishmentId);
    }

    res.status(200).json({
      message: 'Establishment retrieved successfully',
      establishment: {
        ...establishment,
        isFavorite: favoriteStatus,
      },
    });
  } catch (error: unknown) {
    console.error('Error in getEstablishment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAvailableCities: ExpressHandler = async (_, res) => {
  try {
    const cities = await getAllEstablishmentCities();
    res.status(200).json({
      message: 'Available cities retrieved successfully',
      cities,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
