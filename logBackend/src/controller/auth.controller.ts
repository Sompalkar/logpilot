import { type Request, type Response } from "express";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { config } from '../config/env.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

/**
 * User registration
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, password, role = 'user' } = req.body;

  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { username }
  });

  if (existingUser) {
    throw new AppError('Username already exists', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role
    },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true
    }
  });

  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    } as any,
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRY } as any
  ) as string;

  res.status(201).json({
    message: 'User registered successfully',
    user,
    token
  });
});

/**
 * User login
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      role: true
    }
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    } as any,
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRY } as any
  ) as string;

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    },
    token
  });
});

/**
 * Get current user profile
 * GET /api/v1/auth/profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  // User info is attached by auth middleware
  const user = (req as any).user;

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true
    }
  });

  if (!profile) {
    throw new AppError('User not found', 404);
  }

  res.json({ user: profile });
});

/**
 * Refresh JWT token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Generate new token
  const token = jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    } as any,
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRY } as any
  ) as string;

  res.json({
    message: 'Token refreshed successfully',
    token
  });
});
