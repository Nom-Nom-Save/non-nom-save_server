import { ExpressHandler } from '../../shared/types/express.type';
import {
  getUserById,
  updateUser,
  addFavorite,
  removeFavorite,
  getFavorites,
} from './users.service';
import { UpdateUserInput } from './types/users.type';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

export const getMe: ExpressHandler = async (req, res) => {
  try {
    const authUser = (req as AuthenticatedRequest).user;

    if (!authUser || authUser.role !== 'user') {
      res.status(401).json({ error: 'Unauthorized: User only' });
      return;
    }

    const user = await getUserById(authUser.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'User profile retrieved successfully',
      user,
    });
  } catch (error) {
    console.error('Error in getMeController:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUser: ExpressHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      message: `User retrieved successfully`,
      user,
    });
  } catch (error) {
    console.error('Error in getUserController:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserProfile: ExpressHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    if (userId !== authenticatedId) {
      res.status(403).json({ error: 'Access denied: You can only edit your own profile' });
      return;
    }

    const updateData: UpdateUserInput = req.body;

    const existingUser = await getUserById(userId);
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updated = await updateUser(userId, updateData);

    if (!updated) {
      res.status(500).json({ error: 'Failed to update user profile' });
      return;
    }

    res.status(200).json({
      message: 'User profile updated successfully',
      user: updated,
    });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addToFavorites: ExpressHandler = async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { establishmentId } = req.body;

    if (!establishmentId) {
      res.status(400).json({ error: 'Establishment ID is required' });
      return;
    }

    await addFavorite(user!.id, establishmentId);

    res.status(201).json({ message: 'Establishment added to favorites' });
  } catch (error) {
    console.error('Error in addToFavorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeFromFavorites: ExpressHandler = async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { establishmentId } = req.params;

    if (!establishmentId) {
      res.status(400).json({ error: 'Establishment ID is required' });
      return;
    }

    const success = await removeFavorite(user!.id, establishmentId);

    if (!success) {
      res.status(404).json({ error: 'Favorite not found' });
      return;
    }

    res.status(200).json({ message: 'Establishment removed from favorites' });
  } catch (error) {
    console.error('Error in removeFromFavorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyFavorites: ExpressHandler = async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const favorites = await getFavorites(user!.id);

    res.status(200).json({ favorites });
  } catch (error) {
    console.error('Error in getMyFavorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
