import type { Request, Response, NextFunction } from 'express';

export type Params = {
  userId?: string;
  establishmentId?: string;
  id?: string;
  [key: string]: string | string[] | undefined;
};

export type ExpressHandler = (
  req: Request<Params, any, any, any>,
  res: Response,
  next: NextFunction
) => Promise<void> | void;
