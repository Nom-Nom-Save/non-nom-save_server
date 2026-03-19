import {
  LoginDto,
  LoginType,
  RegisterEstablishmentDto,
  RegisterEstablishmentResponse,
  RegisterUserDto,
  RegisterUserResponse,
  UserType,
} from './types/auth.types';
import { db } from '../../database';
import { users } from '../../database/schema/users.schema';
import { eq, and, gt, gte } from 'drizzle-orm';
import { verificationCode } from '../../database/schema/verification_code.schema';
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateVerificationCode,
  hashPassword,
  verifyToken,
} from '../../shared/utils/auth.util';
import { sendPasswordResetCode, sendVerificationEmail } from '../email/email.service';
import { establishments } from '../../database/schema/establishments.schema';
import NodeGeocoder from 'node-geocoder';
import { AppError } from '../../shared/utils/app.error';

export const findByEmail = async (email: string) => {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (user) {
    return {
      type: UserType.USER,
      entity: user,
    };
  }

  const [establishment] = await db
    .select()
    .from(establishments)
    .where(eq(establishments.email, email));
  if (establishment) {
    return {
      type: UserType.ESTABLISHMENT,
      entity: establishment,
    };
  }

  return null;
};

export const registerUser = async ({
  fullName,
  email,
  password,
}: RegisterUserDto): Promise<RegisterUserResponse> => {
  const [establishment] = await db
    .select()
    .from(establishments)
    .where(eq(establishments.email, email));
  const [existingUser] = await db.select().from(users).where(eq(users.email, email));

  if (establishment) {
    throw new AppError('Establishment with such email already exists', 409);
  }

  if (existingUser) {
    if (existingUser.isEmailVerified) {
      throw new AppError('User already exists', 409);
    }

    await db.delete(verificationCode).where(eq(verificationCode.userId, existingUser.id));
    await db.delete(users).where(eq(users.id, existingUser.id));
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
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (user) {
    throw new AppError('User with such email already exists', 409);
  }

  const [existingEstablishment] = await db
    .select()
    .from(establishments)
    .where(eq(establishments.email, email));

  if (existingEstablishment) {
    if (existingEstablishment.isEmailVerified) {
      throw new AppError('Establishment already exists', 409);
    }

    await db.delete(establishments).where(eq(establishments.id, existingEstablishment.id));
    await db
      .delete(verificationCode)
      .where(eq(verificationCode.establishmentId, existingEstablishment.id));
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
  const found = await findByEmail(email);

  if (!found) {
    throw new AppError('User or establishment not found', 404);
  }

  if (found.entity.isEmailVerified) {
    throw new AppError('Email already verified', 400);
  }

  const isUser = found.type === UserType.USER;

  const where = isUser
    ? eq(verificationCode.userId, found.entity.id)
    : eq(verificationCode.establishmentId, found.entity.id);

  const [codeResult] = await db
    .select({
      userId: verificationCode.userId,
      expiresAt: verificationCode.expiresAt,
    })
    .from(verificationCode)
    .where(and(where, eq(verificationCode.code, code), gt(verificationCode.expiresAt, new Date())));

  if (!codeResult) {
    throw new AppError('Invalid or expired verification code', 400);
  }

  if (isUser) {
    await db.update(users).set({ isEmailVerified: true }).where(eq(users.id, found.entity.id));
    await db.delete(verificationCode).where(eq(verificationCode.userId, found.entity.id));
  } else {
    await db
      .update(establishments)
      .set({ isEmailVerified: true })
      .where(eq(establishments.id, found.entity.id));
    await db.delete(verificationCode).where(eq(verificationCode.establishmentId, found.entity.id));
  }
};

export const login = async ({ email, password, loginType }: LoginDto) => {
  if (loginType === LoginType.USER) {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      throw new AppError('No matches for users, please check your email or login', 401);
    }
    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email', 403);
    }

    const match = await comparePassword(password, user.password ?? '');
    if (!match) {
      throw new AppError('No matches for users, please check your email or login', 401);
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
      throw new AppError('No matches for establishment, please check your email or login', 401);
    }
    if (!establishment.isEmailVerified) {
      throw new AppError('Please verify your email', 403);
    }

    const match = await comparePassword(password, establishment.password ?? '');
    if (!match) {
      throw new AppError('No matches for establishment, please check your email or login', 401);
    }

    const accessToken = generateAccessToken(establishment.id, email);
    const refreshToken = generateRefreshToken(establishment.id);

    return { accessToken, refreshToken };
  }
};

export const refreshToken = async (refreshToken: string) => {
  const decoded = verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET!);

  if (!decoded || typeof decoded === 'string') {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const { userOrEstablishmentId } = decoded as { userOrEstablishmentId: string };

  const [user] = await db.select().from(users).where(eq(users.id, userOrEstablishmentId));
  const [establishment] = await db
    .select()
    .from(establishments)
    .where(eq(establishments.id, userOrEstablishmentId));

  if (!user && !establishment) {
    throw new AppError('User or establishment not found', 404);
  }

  const entity = user ?? establishment;
  const newAccessToken = generateAccessToken(userOrEstablishmentId, entity.email);
  const newRefreshToken = generateRefreshToken(userOrEstablishmentId);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const forgotPassword = async (email: string) => {
  const found = await findByEmail(email);

  if (!found) {
    throw new AppError('No user or establishment found for this email', 404);
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

  await db.transaction(async transaction => {
    if (found.type === UserType.USER) {
      await transaction
        .delete(verificationCode)
        .where(eq(verificationCode.userId, found.entity.id));
      await transaction.insert(verificationCode).values({
        userId: found.entity.id,
        code,
        expiresAt,
      });
    } else {
      await transaction
        .delete(verificationCode)
        .where(eq(verificationCode.establishmentId, found.entity.id));
      await transaction.insert(verificationCode).values({
        establishmentId: found.entity.id,
        code,
        expiresAt,
      });
    }
  });

  await sendPasswordResetCode(found.entity.email, code);
};

export const verifyResetCode = async (email: string, code: string) => {
  const found = await findByEmail(email);

  if (!found) {
    throw new AppError('No user or establishment found for this email', 404);
  }

  const where =
    found.type === UserType.USER
      ? eq(verificationCode.userId, found.entity.id)
      : eq(verificationCode.establishmentId, found.entity.id);

  const [codeResult] = await db
    .select()
    .from(verificationCode)
    .where(
      and(where, eq(verificationCode.code, code), gte(verificationCode.expiresAt, new Date()))
    );

  if (!codeResult) {
    throw new AppError('Invalid or expired code', 400);
  }

  await db.delete(verificationCode).where(eq(verificationCode.id, codeResult.id));
};

export const resetPassword = async (email: string, newPassword: string) => {
  const found = await findByEmail(email);

  if (!found) {
    throw new AppError('No user or establishment found for this email', 404);
  }

  const hashedPassword = await hashPassword(newPassword);

  if (found.type === UserType.USER) {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, found.entity.id));
  } else {
    await db
      .update(establishments)
      .set({ password: hashedPassword })
      .where(eq(establishments.id, found.entity.id));
  }
};
