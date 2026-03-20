import { users } from '../../../database/schema/users.schema';
import { InferSelectModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;

export type UpdateUserInput = Partial<{
  fullName: string | null;
  email: string;
  notifyNearby: boolean;
  notifyClosingSoon: boolean;
  notifyNewItems: boolean;
}>;
