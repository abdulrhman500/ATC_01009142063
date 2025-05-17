import { Request, Response, NextFunction } from 'express';
import { IsAuthorizedMiddleware } from '@api/middleware/isAuthorized.middleware'; // Adjust path
import { RoleType } from '@shared/RoleType'; // Adjust path
import { UnauthorizedException, ForbiddenException } from '@shared/exceptions/http.exception'; // Adjust path
import { IJwtPayload } from '@domain/user/interfaces/IJwtService'; // Assuming you created this from previous advice

describe('IsAuthorizedMiddleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>; // Not really used but good to have
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = {}; // Reset request object
        nextFunction = jest.fn();
    });

    it('should call next() if user has an allowed role', () => {
        (mockRequest as any).user = { userId: '1', username: 'adminuser', role: RoleType.ADMIN } as IJwtPayload;
        const middleware = IsAuthorizedMiddleware([RoleType.ADMIN, RoleType.ADMIN]);

        middleware(mockRequest as Request, {} as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith();
        expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    it('should call next() if user has one of multiple allowed roles', () => {
        (mockRequest as any).user = { userId: '2', username: 'testuser', role: RoleType.CUSTOMER } as IJwtPayload;
        const middleware = IsAuthorizedMiddleware([RoleType.ADMIN, RoleType.CUSTOMER]);

        middleware(mockRequest as Request, {} as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith();
        expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    it('should call next with ForbiddenException if user does not have any allowed role', () => {
        (mockRequest as any).user = { userId: '3', username: 'guestuser', role: RoleType.GUEST } as IJwtPayload;
        const middleware = IsAuthorizedMiddleware([RoleType.ADMIN, RoleType.CUSTOMER]);

        middleware(mockRequest as Request, {} as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(expect.any(ForbiddenException));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('You do not have sufficient permissions to access this resource.');
    });

    it('should call next with UnauthorizedException if req.user is not defined', () => {
        // mockRequest.user is undefined by default after reset
        const middleware = IsAuthorizedMiddleware([RoleType.ADMIN]);

        middleware(mockRequest as Request, {} as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedException));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Authentication required.');
    });

    it('should call next with UnauthorizedException if req.user.role is not defined', () => {
        (mockRequest as any).user = { userId: '4', username: 'noroleuser' }; // User exists but role is missing
        const middleware = IsAuthorizedMiddleware([RoleType.ADMIN]);

        middleware(mockRequest as Request, {} as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedException));
         expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Authentication required.');
    });

    it('should allow access if allowedRoles is an empty array (meaning any authenticated user)', () => {
        (mockRequest as any).user = { userId: '5', username: 'anyuser', role: RoleType.GUEST } as IJwtPayload;
        const middleware = IsAuthorizedMiddleware([]); // No specific roles required, just authentication

        middleware(mockRequest as Request, {} as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith();
    });
});