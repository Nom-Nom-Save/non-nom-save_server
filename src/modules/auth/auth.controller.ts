import { ExpressHandler } from '../../shared/types/express.type';
import { handleError } from '../../shared/utils/app.error';
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
    handleError(res, error);
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
    handleError(res, error);
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
    handleError(res, error);
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
    handleError(res, error);
  }
};

export const googleLogin: ExpressHandler = async (req, res) => {
  try {
    const { idToken, loginType } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      res.status(400).json({ message: 'idToken is required' });
      return;
    }

    const result = await authService.loginWithGoogle(idToken, loginType);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: result.isNewUser ? 'Registration successful' : 'Login successful',
      accessToken: result.accessToken,
      user: result.user,
      isNewUser: result.isNewUser,
    });
  } catch (error) {
    handleError(res, error);
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
    handleError(res, error);
  }
};

export const forgotPassword: ExpressHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        message: 'Email is required',
      });

      return;
    }

    if (typeof email !== 'string') {
      res.status(400).json({ message: 'Invalid data format' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    await authService.forgotPassword(normalizedEmail);

    res.status(200).json({
      message: 'Password reset code sent. Please check your email.',
      email: normalizedEmail,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const verifyResetCode: ExpressHandler = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ message: 'Email and code are required' });
      return;
    }

    if (typeof email !== 'string' || typeof code !== 'string') {
      res.status(400).json({ message: 'Invalid data format' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    const trimmedCode = code.trim();
    if (!/^\d{4}$/.test(trimmedCode)) {
      res.status(400).json({ message: 'Code must contain only digits' });
      return;
    }

    await authService.verifyResetCode(normalizedEmail, trimmedCode);

    res.status(200).json({
      message: 'Code verified. You can now reset your password.',
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const resetPassword: ExpressHandler = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      res.status(400).json({ message: 'Email and new password are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    await authService.resetPassword(normalizedEmail, newPassword);

    res.status(200).json({
      message: 'Password successfully reset. You can now log in.',
    });
  } catch (error) {
    handleError(res, error);
  }
};
