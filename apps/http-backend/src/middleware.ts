import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

interface AuthTokenPayload extends JwtPayload {
  userId: string;
}

export function middleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"] ?? "";
  // Support both "Bearer <token>" and raw "<token>"
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

  if (!token) {
    res.status(401).json({
      message: "Unauthorized: No token provided",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;

    if (decoded && decoded.userId) {
      req.userId = String(decoded.userId);
      next();
    } else {
      res.status(401).json({
        message: "Unauthorized: Invalid token payload",
      });
    }
  } catch (error) {
    res.status(401).json({
      message: "Unauthorized: Invalid or expired token",
    });
  }
}