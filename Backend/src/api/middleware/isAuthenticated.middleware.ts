import { Request, Response, NextFunction } from 'express';
import { IJwtPayload, IJwtService } from '@domain/user/interfaces/IJwtService'; // Adjust path
import { JwtService } from '@infrastructure/security/JwtService'; // Import the concrete class
import { UnauthorizedException } from '@shared/exceptions/http.exception'; // Adjust path
import { inject } from 'inversify';
import { TYPES } from '@src/config/types';
import { container } from '@config/inversify.config'

// Instantiate JwtService directly.
// This JwtService will read JWT_SECRET and JWT_EXPIRES_IN from process.env
// const jwtServiceInstance = new JwtService();
const jwtServiceInstance: IJwtService = container.get<IJwtService>(TYPES.IJwtService);


export async function isAuthenticated(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let token: string | undefined = undefined;

        // 1. Try to get token from Authorization header (Bearer token)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove "Bearer "
        }

        // 2. If not in header, try to get token from cookies (e.g., 'accessToken' cookie)
        // This requires 'cookie-parser' middleware to be used in your app setup.
        if (!token && req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        // 3. (Optional) Add other places to look for the token (e.g., query parameters - use with caution)

        if (!token) {
            // Pass error to the global error handler
            return next(new UnauthorizedException('No token provided. Access denied.'));
        }

        const decodedPayload = await jwtServiceInstance.verifyToken(token);

        if (!decodedPayload) {
            return next(new UnauthorizedException('Invalid or expired token. Please log in again.'));
        }

        (req as any).user = decodedPayload as IJwtPayload; // Type assertion to handle missing user property
        next();

    } catch (error) {
        if (error instanceof UnauthorizedException) {
            next(error);
        } else {
            console.error("Unexpected error in isAuthenticated middleware:", error);
            next(new UnauthorizedException('Authentication failed.'));
        }
    }
}