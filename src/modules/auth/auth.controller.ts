import { ExpressHandler } from '../../shared/types/express.type';
import { extractErrorMessage } from '../../shared/utils/error.util';
import * as authService from './auth.service';

export const registerUser: ExpressHandler = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    await authService.registerUser({ fullName, email: normalizedEmail, password });

    res.status(201).json({
      message: 'Registration successful. Please check your email for verification code.',
      email: normalizedEmail,
    });
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    if (errorMessage === 'User already exists') {
      res.status(409).json({ message: 'User with this email already exists' });
      return;
    }

    if (errorMessage === 'Establishment with such email already exists') {
      res.status(409).json({ message: 'Establishment with such email already exists' });
      return;
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

export const registerEstablishment: ExpressHandler = async (req, res) => {
  try {
    const { establishmentName, email, password, address } = req.body;

    if (!establishmentName || !email || !password || !address) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    await authService.registerEstablishment({
      establishmentName,
      email: normalizedEmail,
      password,
      address,
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email for verification code.',
      email: normalizedEmail,
    });
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    if (errorMessage === 'Establishment already exists') {
      res.status(409).json({ message: 'Establishment with this email already exists' });
      return;
    }

    if (errorMessage === 'User with such email already exists') {
      res.status(409).json({ message: 'User with such email already exists' });
      return;
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyEmail: ExpressHandler = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ message: 'Email and verification code are required' });
      return;
    }

    if (typeof email !== 'string' || typeof code !== 'string') {
      res.status(400).json({ message: 'Invalid data format' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (trimmedCode.length !== 4) {
      res.status(400).json({ message: 'Verification code must be 4 digits' });
      return;
    }

    if (!/^\d{4}$/.test(trimmedCode)) {
      res.status(400).json({ message: 'Verification code must contain only digits' });
      return;
    }

    await authService.verifyEmail(normalizedEmail, trimmedCode);

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    const badRequestErrors = new Set([
      'User not found',
      'Email already verified',
      'Invalid or expired verification code',
    ]);

    if (badRequestErrors.has(errorMessage)) {
      res.status(400).json({ message: errorMessage });
      return;
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login: ExpressHandler = async (req, res) => {
  try {
    const { email, password, loginType } = req.body;

    if (!email || !password || !loginType) {
      res.status(400).json({ message: 'Email, password and login type are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    const { accessToken, refreshToken } = await authService.login({
      email: normalizedEmail,
      password,
      loginType,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: 'Login successful', accessToken });
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    if (
      errorMessage === 'No matches for users, please check your email or login' ||
      errorMessage === 'No matches for establishment, please check your email or login'
    ) {
      res.status(401).json({ message: errorMessage });
      return;
    }

    if (errorMessage === 'Please verify your email') {
      res.status(403).json({ message: errorMessage });
      return;
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshToken: ExpressHandler = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      res.status(401).json({ message: 'Missing refresh token' });
      return;
    }

    const { accessToken, refreshToken } = await authService.refreshToken(token);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: 'Token refreshed successfully', accessToken });
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    if (errorMessage === 'Invalid or expired refresh token') {
      res.status(401).json({ message: errorMessage });
      return;
    }

    if (errorMessage === 'User or establishment not found') {
      res.status(404).json({ message: errorMessage });
      return;
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};
