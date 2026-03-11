import type { Request, Response, NextFunction } from 'express';

export type ExpressHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
