import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  patientId?: string;
  phone?: string;
}

/**
 * Middleware to protect routes and verify JWT tokens.
 * Extracts 'sub' (patientId) and 'phone' from the token.
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access token is missing or invalid'
    });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('[authMiddleware] JWT_SECRET is not configured');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { sub: string; phone: string };
    
    // Inject user data into the request object
    req.patientId = decoded.sub;
    req.phone = decoded.phone;
    
    next();
  } catch (err) {
    console.error('[authMiddleware] JWT Verification failed:', err);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Token has expired or is invalid'
    });
  }
}
