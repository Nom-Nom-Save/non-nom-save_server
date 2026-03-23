import type { Request, Response, NextFunction } from 'express';

type Params = {
  userId?: string;
  establishmentId?: string;
  id?: string;
  [key: string]: string | undefined;
};

export type ExpressHandler = (
  req: Request<Params>,
  res: Response,
  next: NextFunction
) => Promise<void> | void;
