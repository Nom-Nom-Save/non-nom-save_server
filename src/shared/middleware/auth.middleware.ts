import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.util';
import { db } from '../../database';
import { establishments } from '../../database/schema/establishments.schema';
import { users } from '../../database/schema/users.schema';
import { eq } from 'drizzle-orm';
import { Params } from '../types/express.type';

export interface AuthenticatedRequest extends Request<Params, any, any, any> {
  establishment?: any;
  authenticatedUser?: any;
  user?: {
    id: string;
    email: string;
    role: 'user' | 'establishment';
  };
}

export const establishmentAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET!) as any;

    if (!decoded || !decoded.userOrEstablishmentId) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
      return;
    }

    const [establishment] = await db
      .select()
      .from(establishments)
      .where(eq(establishments.id, decoded.userOrEstablishmentId));

    if (!establishment) {
      res.status(403).json({ message: 'Forbidden: Access only for establishments' });
      return;
    }

    (req as any).user = { id: establishment.id, email: establishment.email, role: 'establishment' };
    (req as any).establishment = establishment;

    next();
  } catch (error) {
    console.error('Establishment auth error:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

export const userAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET!) as any;

    if (!decoded || !decoded.userOrEstablishmentId) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.id, decoded.userOrEstablishmentId));

    if (!user) {
      res.status(403).json({ message: 'Forbidden: Access only for users' });
      return;
    }

    (req as any).user = { id: user.id, email: user.email, role: 'user' };
    (req as any).authenticatedUser = user;

    next();
  } catch (error) {
    console.error('User auth error:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET!) as any;

    if (!decoded || !decoded.userOrEstablishmentId) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.id, decoded.userOrEstablishmentId));
    if (user) {
      (req as any).user = { id: user.id, email: user.email, role: 'user' };
      (req as any).authenticatedUser = user;
      return next();
    }

    const [establishment] = await db
      .select()
      .from(establishments)
      .where(eq(establishments.id, decoded.userOrEstablishmentId));
    if (establishment) {
      (req as any).user = {
        id: establishment.id,
        email: establishment.email,
        role: 'establishment',
      };
      (req as any).establishment = establishment;
      return next();
    }

    res.status(401).json({ message: 'User or establishment not found' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
