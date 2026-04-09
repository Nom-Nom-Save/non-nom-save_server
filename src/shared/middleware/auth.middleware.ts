import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.util';
import { db } from '../../database';
import { establishments } from '../../database/schema/establishments.schema';
import { users } from '../../database/schema/users.schema';
import { eq } from 'drizzle-orm';
import { Params } from '../types/express.type';
import { UserType } from '../../modules/auth/types/auth.types';
import { Establishment } from '../../modules/establishments/types/establishments.type';
import { InferSelectModel } from 'drizzle-orm';

type User = InferSelectModel<typeof users>;

export interface AuthenticatedRequest extends Request<Params, any, any, any> {
  establishment?: Establishment;
  authenticatedUser?: User;
  user?: {
    id: string;
    email: string;
    role: UserType;
  };
}

interface DecodedToken {
  userOrEstablishmentId: string;
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
    const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET!) as DecodedToken | null;

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

    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: establishment.id,
      email: establishment.email,
      role: UserType.ESTABLISHMENT,
    };
    authReq.establishment = establishment;

    next();
  } catch (error: unknown) {
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
    const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET!) as DecodedToken | null;

    if (!decoded || !decoded.userOrEstablishmentId) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.id, decoded.userOrEstablishmentId));

    if (!user) {
      res.status(403).json({ message: 'Forbidden: Access only for users' });
      return;
    }

    const authReq = req as AuthenticatedRequest;
    authReq.user = { id: user.id, email: user.email, role: UserType.USER };
    authReq.authenticatedUser = user;

    next();
  } catch (error: unknown) {
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
    const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET!) as DecodedToken | null;

    if (!decoded || !decoded.userOrEstablishmentId) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    const authReq = req as AuthenticatedRequest;

    const [user] = await db.select().from(users).where(eq(users.id, decoded.userOrEstablishmentId));
    if (user) {
      authReq.user = { id: user.id, email: user.email, role: UserType.USER };
      authReq.authenticatedUser = user;
      return next();
    }

    const [establishment] = await db
      .select()
      .from(establishments)
      .where(eq(establishments.id, decoded.userOrEstablishmentId));
    if (establishment) {
      authReq.user = {
        id: establishment.id,
        email: establishment.email,
        role: UserType.ESTABLISHMENT,
      };
      authReq.establishment = establishment;
      return next();
    }

    res.status(401).json({ message: 'User or establishment not found' });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET!) as DecodedToken | null;

    if (!decoded || !decoded.userOrEstablishmentId) {
      return next();
    }

    const authReq = req as AuthenticatedRequest;

    const [user] = await db.select().from(users).where(eq(users.id, decoded.userOrEstablishmentId));
    if (user) {
      authReq.user = { id: user.id, email: user.email, role: UserType.USER };
      authReq.authenticatedUser = user;
      return next();
    }

    const [establishment] = await db
      .select()
      .from(establishments)
      .where(eq(establishments.id, decoded.userOrEstablishmentId));
    if (establishment) {
      authReq.user = {
        id: establishment.id,
        email: establishment.email,
        role: UserType.ESTABLISHMENT,
      };
      authReq.establishment = establishment;
      return next();
    }

    next();
  } catch (error: unknown) {
    next();
  }
};
