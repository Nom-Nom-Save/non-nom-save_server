import { ExpressHandler } from '../../shared/types/express.type';
import {
  updateEstablishment,
  getEstablishmentById,
  getEstablishmentByIdPrivate,
  getAllEstablishments,
  getEstablishmentsByCity,
  getEstablishmentsByRadius,
} from './establishments.service';
import { UpdateEstablishmentInput } from './types/establishments.type';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

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
  } catch (error) {
    console.error('Error in getEstablishmentPrivate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNearbyEstablishments: ExpressHandler = async (req, res) => {
  try {
    const { lat, lon, radius, page, limit } = req.query;

    if (!lat || !lon || !radius) {
      res.status(400).json({ error: 'lat, lon, and radius are required' });
      return;
    }

    const pagination = page && limit ? { page: Number(page), limit: Number(limit) } : undefined;

    const { establishments: nearby, total } = await getEstablishmentsByRadius(
      Number(lat),
      Number(lon),
      Number(radius),
      pagination
    );

    if (pagination) {
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
    } else {
      res.status(200).json({
        message: 'Nearby establishments retrieved successfully',
        establishments: nearby,
      });
    }
  } catch (error) {
    console.error('Error in getNearbyEstablishments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEstablishments: ExpressHandler = async (req, res) => {
  try {
    const { city, page, limit } = req.query;
    let result: { establishments: any[]; total: number };

    const pagination = page && limit ? { page: Number(page), limit: Number(limit) } : undefined;

    if (city && typeof city === 'string') {
      result = await getEstablishmentsByCity(city, pagination);
    } else {
      result = await getAllEstablishments(pagination);
    }

    const { establishments, total } = result;

    if (pagination) {
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
    } else {
      res.status(200).json({
        message: 'Establishments retrieved successfully',
        establishments,
      });
    }
  } catch (error) {
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
  } catch (error) {
    console.error('Error in updateEstablishmentProfile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEstablishment: ExpressHandler = async (req, res) => {
  try {
    const { establishmentId } = req.params;

    if (!establishmentId) {
      res.status(400).json({ error: 'Establishment ID is required' });
      return;
    }

    const establishment = await getEstablishmentById(establishmentId);

    if (!establishment) {
      res.status(404).json({ error: 'Establishment not found' });
      return;
    }

    res.status(200).json({
      message: 'Establishment retrieved successfully',
      establishment,
    });
  } catch (error) {
    console.error('Error in getEstablishment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
