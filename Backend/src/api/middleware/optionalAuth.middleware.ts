import { Request, Response, NextFunction } from 'express';
import { IJwtPayload, IJwtService } from '@domain/user/interfaces/IJwtService'; // Adjust path
import { container } from '@config/inversify.config'; // To resolve JwtService
import { TYPES } from '@config/types';

// Resolve the JwtService instance from the Inversify container ONCE
const jwtServiceInstance: IJwtService = container.get<IJwtService>(TYPES.IJwtService);

export async function IdentifyUserIfLogedin(req: Request, res: Response, next: NextFunction): Promise<void> {
    let token: string | undefined = undefined;
    (req as any).user = undefined; // Explicitly set to undefined initially

    try {
        // 1. Try to get token from Authorization header (Bearer token)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        // 2. If not in header, try to get token from cookies
        if (!token && req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (token) {
            const decodedPayload = await jwtServiceInstance.verifyToken(token);
            if (decodedPayload) {
                // Attach the decoded payload to req.user
                // Consistent with your preference to use 'as any' if Request interface is not extended
                (req as any).user = decodedPayload as IJwtPayload;
            }
        }
    } catch (error) {
        // Log error but do not block the request, as auth is optional
        console.warn('OptionalAuthMiddleware: Error verifying token (token ignored):', error instanceof Error ? error.message : 'Unknown error');
    }
    next(); // Always proceed, even if no user is authenticated
}