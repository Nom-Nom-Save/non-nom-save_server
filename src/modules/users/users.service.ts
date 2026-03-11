import { logUtil } from '../../shared/utils/log.util';
import { MockUser } from './types/users.type';

const mockUsers: Record<string, MockUser> = {
  '1': {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'admin',
    createdAt: '2024-01-15T10:00:00Z',
  },
  '2': {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'user',
    createdAt: '2024-03-22T14:30:00Z',
  },
  '3': {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'moderator',
    createdAt: '2025-06-10T09:15:00Z',
  },
};

// eslint-disable-next-line @typescript-eslint/require-await
export const getUserById = async (userId: string): Promise<MockUser | null> => {
  console.log(` Fetching user with ID: ${userId}`);

  const user = mockUsers[userId];

  if (!user) {
    console.log(`User with ID ${userId} not found.`);
    return null;
  }

  logUtil();
  console.log(`User found: ${user.name}`);
  return { ...user };
};
