import { ExpressHandler } from '../../shared/types/express.type';
import { getUserById, updateUser } from './users.service';
import { UpdateUserInput } from './types/users.type';

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
    const authenticatedId = (req as any).user?.id;

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
