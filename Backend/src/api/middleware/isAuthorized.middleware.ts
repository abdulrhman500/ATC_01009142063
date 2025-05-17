import { Request, Response, NextFunction } from 'express';
import { RoleType } from '@shared/RoleType';
import { UnauthorizedException, ForbiddenException } from '@shared/exceptions/http.exception';

export function IsAuthorizedMiddleware(allowedRoles: RoleType[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as any).user;

        if (!user || !(user as any).role) {
            // This implies isAuthenticated middleware didn't run or failed to attach user
            return next(new UnauthorizedException('Authentication required.'));
        }
        if (allowedRoles.length === 0) {
            next(); // Grant access
            return;
        }
        const userRole = user.role as RoleType; // Assuming req.user.role matches RoleType values

        if (allowedRoles.includes(userRole)) {
            next(); // User has one of the allowed roles
        } else {
            return next(new ForbiddenException('You do not have sufficient permissions to access this resource.'));
        }
    };
}