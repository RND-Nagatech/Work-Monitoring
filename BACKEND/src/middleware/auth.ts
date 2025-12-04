import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, 'No token provided', undefined, 401);
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    errorResponse(res, 'Invalid or expired token', undefined, 401);
  }
};

export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', undefined, 401);
    return;
  }

  // Allow admin and manager roles to access admin routes
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    errorResponse(res, 'Admin or manager access required', undefined, 403);
    return;
  }

  next();
};

export const isEmployee = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', undefined, 401);
    return;
  }

  if (req.user.role !== 'employee') {
    errorResponse(res, 'Employee access required', undefined, 403);
    return;
  }

  // Additional guard: employee endpoints require a valid pegawai_id
  if (!req.user.pegawai_id) {
    errorResponse(res, 'Employee ID not found in token', undefined, 400);
    return;
  }

  next();
};
