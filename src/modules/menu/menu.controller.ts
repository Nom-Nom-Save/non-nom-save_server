import { ExpressHandler } from '../../shared/types/express.type';
import * as menuService from './menu.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export const addToMenu: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
    const { itemId, itemType, totalQuantity, originalPrice, discountPrice, startTime, endTime } =
      req.body;

    if (!itemId || !itemType || !totalQuantity || !originalPrice) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const menuEntry = await menuService.addItemToMenu(establishment.id, establishment.boundTo, {
      itemId,
      itemType,
      totalQuantity,
      originalPrice,
      discountPrice,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });

    res.status(201).json({ message: 'Item added to menu successfully', menuEntry });
  } catch (error) {
    console.error('Error adding to menu:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ message });
  }
};

export const getMenu: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
    const menu = await menuService.getMenuForEstablishment(establishment.id);

    res.status(200).json({ menu });
  } catch (error) {
    console.error('Error getting menu:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPublicMenu: ExpressHandler = async (req, res) => {
  try {
    const { establishmentId } = req.params;

    if (!establishmentId) {
      res.status(400).json({ message: 'Establishment ID is required' });
      return;
    }

    const menu = await menuService.getPublicMenu(establishmentId);

    res.status(200).json({ menu });
  } catch (error) {
    console.error('Error getting public menu:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMenuItem: ExpressHandler = async (req, res) => {
  try {
    const { menuId } = req.params;

    if (!menuId) {
      res.status(400).json({ message: 'Menu item ID is required' });
      return;
    }

    const menuItem = await menuService.getMenuItemById(menuId as string);

    if (!menuItem) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }

    res.status(200).json({ menuItem });
  } catch (error) {
    console.error('Error getting menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const changeStatus: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
    const { id } = req.params;
    const { status } = req.body;

    if (status !== 'Active' && status !== 'Inactive') {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const success = await menuService.updateMenuStatus(id!, establishment.id, status);

    if (!success) {
      res.status(404).json({ message: 'Menu item not found or unauthorized' });
      return;
    }

    res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateMenu: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment;
    const { id } = req.params;
    const { totalQuantity, originalPrice, discountPrice, startTime, endTime } = req.body;

    const success = await menuService.updateMenuItem(id!, establishment.id, {
      totalQuantity,
      originalPrice,
      discountPrice,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });

    if (!success) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }

    res.status(200).json({ message: 'Menu item updated successfully' });
  } catch (error) {
    console.error('Error updating menu item:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(400).json({ message });
  }
};
