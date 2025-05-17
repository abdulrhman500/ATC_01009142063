import { Request, Response, NextFunction } from 'express';
import { isAuthenticated } from '@api/middleware/isAuthenticated.middleware'; // Adjust path
import { JwtService } from '@infrastructure/security/JwtService'; // To generate tokens for tests
import { IJwtPayload, IJwtService } from '@domain/user/interfaces/IJwtService'; // Adjust path
import { UnauthorizedException } from '@shared/exceptions/http.exception'; // Adjust path
import { RoleType } from '@shared/RoleType'; // Adjust path
import { container } from '@config/inversify.config'; // To get the same instance used by middleware
import { TYPES } from '@config/types';

// Use the same JwtService instance that the middleware will resolve via Inversify container
// This ensures we are testing with the same configuration.
// This assumes your isAuthenticated.middleware.ts uses:
// const jwtServiceInstance: IJwtService = container.get<IJwtService>(TYPES.JwtService);
// If isAuthenticated instantiates `new JwtService()` directly, then do the same here:
// const jwtServiceForTest = new JwtService();
// For this example, we'll assume the middleware resolves it via the container.
let jwtServiceForTest: IJwtService;


describe('isAuthenticated Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeAll(() => {
        // Ensure JwtService is bound for testing if it's not already globally
        if (!container.isBound(TYPES.IJwtService)) {
            container.bind<IJwtService>(TYPES.IJwtService).to(JwtService).inSingletonScope();
        }
        jwtServiceForTest = container.get<JwtService>(TYPES.IJwtService);
    });

    beforeEach(() => {
        mockRequest = {
            headers: {},
            cookies: {},
        };
        nextFunction = jest.fn();
    });

    const testUserPayload: IJwtPayload = {
        userId: '123',
        username: 'testuser',
        role: RoleType.CUSTOMER, // Use your RoleType enum
    };

    it('should call next with UnauthorizedException if no token is provided', async () => {
        mockResponse = {};
        await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedException));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('No token provided. Access denied.');
    });

    it('should call next with UnauthorizedException if token is invalid (bad signature)', async () => {
        mockRequest.headers = { authorization: 'Bearer invalidsignaturetoken' };
        await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedException));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toMatch(/Invalid or expired token|jwt malformed|invalid signature/i);
    });

    it('should call next with UnauthorizedException if token is expired', async () => {
        // Generate an expired token (using a very short expiry for testing)
        const originalExpiresIn = process.env.JWT_EXPIRES_IN;
        process.env.JWT_EXPIRES_IN = '1s'; // Override for this test
        const tempJwtService = new JwtService(); // Re-instantiate to pick up new expiry
        const { accessToken: expiredToken } = await tempJwtService.generateToken(testUserPayload);
        process.env.JWT_EXPIRES_IN = originalExpiresIn; // Restore original

        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for token to expire

        mockRequest.headers = { authorization: `Bearer ${expiredToken}` };
        await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedException));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toMatch(/Invalid or expired token|jwt expired/i);
    });

    it('should attach user to req and call next() if token in Authorization header is valid', async () => {
        const { accessToken } = await jwtServiceForTest.generateToken(testUserPayload);
        mockRequest.headers = { authorization: `Bearer ${accessToken}` };

        await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(); // Called with no arguments
        expect(nextFunction).toHaveBeenCalledTimes(1);
        expect((mockRequest as any).user).toBeDefined();
        expect((mockRequest as any).user.userId).toBe(testUserPayload.userId);
        expect((mockRequest as any).user.username).toBe(testUserPayload.username);
        expect((mockRequest as any).user.role).toBe(testUserPayload.role);
    });

    it('should attach user to req and call next() if token in cookie is valid', async () => {
        const { accessToken } = await jwtServiceForTest.generateToken(testUserPayload);
        mockRequest.cookies = { accessToken: accessToken }; // Simulating cookie-parser

        await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith();
        expect(nextFunction).toHaveBeenCalledTimes(1);
        expect((mockRequest as any).user).toBeDefined();
        expect((mockRequest as any).user.userId).toBe(testUserPayload.userId);
    });

    it('should prioritize Authorization header over cookie if both present', async () => {
        const { accessToken: headerToken } = await jwtServiceForTest.generateToken(testUserPayload);
        const { accessToken: cookieToken } = await jwtServiceForTest.generateToken({ ...testUserPayload, userId: '789' });

        mockRequest.headers = { authorization: `Bearer ${headerToken}` };
        mockRequest.cookies = { accessToken: cookieToken };

        await isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith();
        expect((mockRequest as any).user.userId).toBe(testUserPayload.userId); // Should be from headerToken
    });
});