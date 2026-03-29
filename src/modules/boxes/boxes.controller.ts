import { ExpressHandler } from '../../shared/types/express.type';
import * as boxesService from './boxes.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export const createBox: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
    const { name, picture, description, recommendedPrice, quantityOfItems, typeIds, productIds } =
      req.body;

    if (!name || quantityOfItems === undefined) {
      res.status(400).json({ message: 'Name and quantityOfItems are required' });
      return;
    }

    const box = await boxesService.createBox({
      name,
      picture,
      description,
      recommendedPrice,
      quantityOfItems,
      boundTo: establishment.boundTo,
      typeIds,
      productIds,
    });

    res.status(201).json({ message: 'Box created successfully', box });
  } catch (error) {
    console.error('Error creating box:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBoxes: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
    const { type } = req.query;
    const filterType = type === 'Private' ? 'Private' : 'All';

    const boxes = await boxesService.getBoxes(establishment.boundTo, filterType);

    res.status(200).json({ boxes });
  } catch (error) {
    console.error('Error getting boxes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateBox: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
    const { id } = req.params;
    const { name, picture, description, recommendedPrice, quantityOfItems, typeIds, productIds } =
      req.body;

    const existingBox = await boxesService.getBoxById(id!);

    if (!existingBox) {
      res.status(404).json({ message: 'Box not found' });
      return;
    }

    if (existingBox.boundTo !== establishment.boundTo) {
      res.status(403).json({ message: 'Forbidden: You can only edit your own boxes' });
      return;
    }

    const updated = await boxesService.updateBox(id!, {
      name,
      picture,
      description,
      recommendedPrice,
      quantityOfItems,
      typeIds,
      productIds,
    });

    res.status(200).json({ message: 'Box updated successfully', box: updated });
  } catch (error) {
    console.error('Error updating box:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteBox: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
    const { id } = req.params;

    const existingBox = await boxesService.getBoxById(id!);

    if (!existingBox) {
      res.status(404).json({ message: 'Box not found' });
      return;
    }

    if (existingBox.boundTo !== establishment.boundTo) {
      res.status(403).json({ message: 'Forbidden: You can only delete your own boxes' });
      return;
    }

    await boxesService.deleteBox(id!);

    res.status(200).json({ message: 'Box deleted successfully' });
  } catch (error) {
    console.error('Error deleting box:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
