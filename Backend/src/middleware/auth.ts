import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { UserModel, IUser, UserRole } from '../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
    return;
  }

  try {
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authenticated user account no longer exists.'
      });
      return;
    }

    if (user.status === 'INACTIVE') {
      res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact your workspace administrator.'
      });
      return;
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication server error',
      error
    });
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
        requiredRoles: allowedRoles
      });
      return;
    }

    next();
  };
}

export function requireRole(allowedRoles: UserRole[]) {
  return authorize(...allowedRoles);
}

