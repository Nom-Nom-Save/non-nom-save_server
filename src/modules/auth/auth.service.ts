import {
  LoginDto,
  LoginType,
  RegisterEstablishmentDto,
  RegisterEstablishmentResponse,
  RegisterUserDto,
  RegisterUserResponse,
} from './types/auth.types';
import { db } from '../../database';
import { users } from '../../database/schema/users.schema';
import { eq, and, gt } from 'drizzle-orm';
import { verificationCode } from '../../database/schema/verification_code.schema';
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateVerificationCode,
  hashPassword,
  verifyToken,
} from '../../shared/utils/auth.util';
import { sendVerificationEmail } from '../email/email.service';
import { establishments } from '../../database/schema/establishments.schema';
import NodeGeocoder from 'node-geocoder';

export const registerUser = async ({
  fullName,
  email,
  password,
}: RegisterUserDto): Promise<RegisterUserResponse> => {
  const existingEstablishment = await db
    .select()
    .from(establishments)
    .where(eq(establishments.email, email));
  const existingUser = await db.select().from(users).where(eq(users.email, email));

  if (existingEstablishment.length > 0) {
    const establishment = existingEstablishment[0];

    if (establishment) {
      throw new Error('Establishment with such email already exists');
    }
  }

  if (existingUser.length > 0) {
    const user = existingUser[0];

    if (user.isEmailVerified) {
      throw new Error('User already exists');
    }

    await db.delete(verificationCode).where(eq(verificationCode.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
  }

  const hashedPassword = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      fullName,
      email,
      password: hashedPassword,
    })
    .returning();

  const userId = user.id;

  await db.delete(verificationCode).where(eq(verificationCode.userId, userId));

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

  await db.insert(verificationCode).values({
    userId,
    code,
    expiresAt,
  });

  await sendVerificationEmail(email, code);

  return { userId };
};

export const registerEstablishment = async ({
  establishmentName,
  email,
  password,
  address,
}: RegisterEstablishmentDto): Promise<RegisterEstablishmentResponse> => {
  const existingEstablishment = await db
    .select()
    .from(establishments)
    .where(eq(establishments.email, email));
  const existingUser = await db.select().from(users).where(eq(users.email, email));

  if (existingUser.length > 0) {
    const user = existingUser[0];

    if (user.isEmailVerified) {
      throw new Error('User with such email already exists');
    }
  }

  if (existingEstablishment.length > 0) {
    const establishment = existingEstablishment[0];

    if (establishment.isEmailVerified) {
      throw new Error('Establishment already exists');
    }

    await db.delete(establishments).where(eq(establishments.id, establishment.id));
    await db.delete(verificationCode).where(eq(verificationCode.establishmentId, establishment.id));
  }

  const hashedPassword = await hashPassword(password);

  const options: NodeGeocoder.Options = {
    provider: 'openstreetmap',
    language: 'en',
  };

  const geocoder = NodeGeocoder(options);
  let latitude: string | undefined;
  let longitude: string | undefined;

  try {
    const response = await geocoder.geocode(address);

    if (response.length > 0 && response[0].latitude && response[0].longitude) {
      latitude = String(response[0].latitude);
      longitude = String(response[0].longitude);
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  const [establishment] = await db
    .insert(establishments)
    .values({
      email,
      name: establishmentName,
      password: hashedPassword,
      address,
      latitude,
      longitude,
    })
    .returning();

  const establishmentId = establishment.id;

  await db.delete(verificationCode).where(eq(verificationCode.establishmentId, establishmentId));

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

  await db.insert(verificationCode).values({
    code,
    expiresAt,
    establishmentId,
  });

  await sendVerificationEmail(email, code);

  return { establishmentId };
};

export const verifyEmail = async (email: string, code: string) => {
  if (!code || code.length < 4 || typeof code !== 'string') {
    throw new Error('Invalid code format');
  }

  const userResult = await db
    .select({
      id: users.id,
      isEmailVerified: users.isEmailVerified,
    })
    .from(users)
    .where(eq(users.email, email));

  if (userResult.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult[0];

  if (user.isEmailVerified) {
    throw new Error('Email already verified');
  }

  const codeResult = await db
    .select({
      userId: verificationCode.userId,
      expiresAt: verificationCode.expiresAt,
    })
    .from(verificationCode)
    .where(
      and(
        eq(verificationCode.userId, user.id),
        eq(verificationCode.code, code),
        gt(verificationCode.expiresAt, new Date())
      )
    );

  if (codeResult.length === 0) {
    throw new Error('Invalid or expired verification code');
  }

  await db.update(users).set({ isEmailVerified: true }).where(eq(users.id, user.id));

  await db.delete(verificationCode).where(eq(verificationCode.userId, user.id));
};

export const login = async ({ email, password, loginType }: LoginDto) => {
  if (loginType === LoginType.USER) {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      throw new Error('No matches for users, please check your email or login');
    }

    if (!user.isEmailVerified) {
      throw new Error('Please verify your email');
    }

    const match = await comparePassword(password, user.password ?? '');
    if (!match) {
      throw new Error('No matches for users, please check your email or login');
    }

    const accessToken = generateAccessToken(user.id, email);
    const refreshToken = generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  } else {
    const [establishment] = await db
      .select()
      .from(establishments)
      .where(eq(establishments.email, email));

    if (!establishment) {
      throw new Error('No matches for establishment, please check your email or login');
    }
    if (!establishment.isEmailVerified) {
      throw new Error('Please verify your email');
    }

    const match = await comparePassword(password, establishment.password ?? '');
    if (!match) {
      throw new Error('No matches for users, please check your email or login');
    }

    const accessToken = generateAccessToken(establishment.id, email);
    const refreshToken = generateRefreshToken(establishment.id);

    return { accessToken, refreshToken };
  }
};

export const refreshToken = async (refreshToken: string) => {
  const decoded = verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET!);

  if (!decoded || typeof decoded === 'string') {
    throw new Error('Invalid or expired refresh token');
  }

  const { userOrEstablishmentId } = decoded as { userOrEstablishmentId: string };

  const [user] = await db.select().from(users).where(eq(users.id, userOrEstablishmentId));
  const [establishment] = await db
    .select()
    .from(establishments)
    .where(eq(establishments.id, userOrEstablishmentId));

  if (!user && !establishment) {
    throw new Error('User or establishment not found');
  }

  if (user && !establishment) {
    const accessToken = generateAccessToken(userOrEstablishmentId, user.email);
    const newRefreshToken = generateRefreshToken(userOrEstablishmentId);

    return { accessToken, refreshToken: newRefreshToken };
  } else {
    const accessToken = generateAccessToken(userOrEstablishmentId, establishment.email);
    const newRefreshToken = generateRefreshToken(userOrEstablishmentId);

    return { accessToken, refreshToken: newRefreshToken };
  }
};
