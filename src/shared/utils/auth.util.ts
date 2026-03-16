import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const hashPassword = (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateVerificationCode = (): string => {
  const randomNumber = crypto.randomInt(1000, 10000);
  return randomNumber.toString();
};

export const generateAccessToken = (userOrEstablishmentId: string, email: string): string => {
  return jwt.sign({ userOrEstablishmentId, email }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: '2h',
  });
};

export const generateRefreshToken = (userOrEstablishmentId: string) => {
  return jwt.sign({ userOrEstablishmentId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string, secret: string) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};
