import { ExpressHandler } from '../../shared/types/express.type';
import { getUserById } from './users.service';
import { MockUser } from './types/users.type';

export const getUser: ExpressHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const user: MockUser | null = await getUserById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      message: `User ${userId} was gotten successfully`,
      user,
    });
  } catch (error) {
    console.error('Error in getUserController:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
