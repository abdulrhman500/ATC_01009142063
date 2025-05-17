import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import {
    PrismaClient,
    User as PrismaUser,
    Role as PrismaRoleEnum, // Assuming 'admin' and 'customer' from your schema
    Venue as PrismaVenue,
} from '@prisma/client';
import { app } from '@src/main'; // Your configured Express app instance
import IPasswordHasher from '@domain/user/interfaces/IPasswordHasher';
import { Argon2PasswordHasher } from '@src/infrastructure/Argon2PasswordHasher';
// Using jwt.sign directly for simplicity as per your previous test file structure
import { IJwtPayload } from '@domain/user/interfaces/IJwtService';
import { RoleType as ActualRoleTypeEnum } from '@src/shared/RoleType'; // Your shared RoleType enum
import jwt from 'jsonwebtoken';

const API_ROOT_PATH = process.env.API_ROOT_PATH || '/api/v1';
const VENUES_ROUTE = `${API_ROOT_PATH}/venues`;

const prisma = new PrismaClient();
const passwordHasher: IPasswordHasher = new Argon2PasswordHasher();

// --- Helper Function to Create User ---
async function createUser(username: string, email: string, role: PrismaRoleEnum, plainPassword?: string): Promise<PrismaUser> {
    const passwordHash = await passwordHasher.hash(plainPassword || 'Password123!');
    return prisma.user.create({
        data: {
            username, email, password: passwordHash, // Using 'password' field for hash as per your DB log
            role,
            firstName: 'Test', middleName: 'User', lastName: role.toString(),
        }
    });
}

// --- Helper function to create a venue (from your previous test) ---
async function createVenueHelper(name: string): Promise<PrismaVenue> {
    // This requires 'name' to be @unique in your Venue schema
    return prisma.venue.upsert({
        where: { name },
        update: {},
        create: { name, street: 'Default Street', city: 'Default City', state: 'DS', country: 'Testland' },
    });
}


describe(`GET ${VENUES_ROUTE} (List All Venues - Integration)`, () => {
    let adminUser: PrismaUser;
    let customerUser: PrismaUser;
    let adminToken: string;
    let customerToken: string;

    const venueData = [
        { name: "City Arena Test", street: "1 Arena Rd", city: "Metro City", state: "MC", country: "Testland" },
        { name: "Community Hall Test", street: "2 Community Dr", city: "Townsville", state: "TS", country: "Testland" },
        { name: "The Grand Theatre Test", street: "3 Theatre Ln", city: "Metro City", state: "MC", country: "Testland" }
    ];

    beforeAll(async () => {
        // Create Admin and Customer users for auth testing
        adminUser = await createUser('venue_admin', 'venue_admin@example.com', PrismaRoleEnum.admin, 'AdminPassSecure1!');
        customerUser = await createUser('venue_customer', 'venue_customer@example.com', PrismaRoleEnum.customer, 'CustPassSecure1!');

        const adminPayload: IJwtPayload = { userId: String(adminUser.id), username: adminUser.username, role: adminUser.role as ActualRoleTypeEnum };
        const customerPayload: IJwtPayload = { userId: String(customerUser.id), username: customerUser.username, role: customerUser.role as ActualRoleTypeEnum };

        const jwtSecret = process.env.JWT_SECRET || 'fallback-test-secret-for-jest-atleast32chars';
        if (jwtSecret === 'fallback-test-secret-for-jest-atleast32chars') {
            console.warn("⚠️ Using fallback JWT secret for venue tests. Ensure JWT_SECRET is in .env.test");
        }

        adminToken = jwt.sign(adminPayload, jwtSecret, { expiresIn: '1h' });
        customerToken = jwt.sign(customerPayload, jwtSecret, { expiresIn: '1h' });

        // Clean and seed venue data
        await prisma.event.deleteMany({}); // Clear events that might depend on venues
        await prisma.venue.deleteMany({});
        await prisma.venue.createMany({
            data: venueData,
            skipDuplicates: true, // In case names were not unique and upsert was used
        });
    });

    afterAll(async () => {
        await prisma.event.deleteMany({});
        await prisma.venue.deleteMany({});
        await prisma.user.deleteMany({ where: { id: { in: [adminUser?.id, customerUser?.id].filter(id => id !== undefined) as number[] } } });
        await prisma.$disconnect();
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
        const response = await request(app).get(VENUES_ROUTE);
        expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
        // Your isAuthenticated middleware throws: 'No token provided. Access denied.'
        // Your ErrorHandler.middleware for UnauthorizedException might format this.
        expect(response.body.message).toMatch(/No token provided|Authentication required/i);
    });

    it('should return 403 Forbidden if authenticated user is not an ADMIN', async () => {
        const response = await request(app)
            .get(VENUES_ROUTE)
            .set('Authorization', `Bearer ${customerToken}`); // Using customer token

        expect(response.status).toBe(StatusCodes.FORBIDDEN);
        expect(response.body.message).toBe('You do not have sufficient permissions to access this resource.');
    });

    it('should return a list of all venues with status 200 if user is ADMIN', async () => {
        const response = await request(app)
            .get(VENUES_ROUTE)
            .set('Authorization', `Bearer ${adminToken}`); // Using admin token

        expect(response.status).toBe(StatusCodes.OK);
        expect(response.body.message).toBe("Venues retrieved successfully.");
        expect(response.body.payload).toBeDefined();
        expect(response.body.payload.data).toBeInstanceOf(Array);
        expect(response.body.payload.data.length).toBe(venueData.length);

        const receivedNames = response.body.payload.data.map((v: any) => v.name);
        expect(receivedNames).toContain("City Arena Test");
        expect(receivedNames).toContain("Community Hall Test");
        expect(response.body.payload.data[0]).toHaveProperty('id');
        expect(response.body.payload.data[0]).toHaveProperty('street');
    });

    it('should return an empty list if no venues exist and user is ADMIN', async () => {
        // Delete all venues first (except those potentially created by other parallel tests,
        // though Jest usually runs files serially unless configured otherwise)
        await prisma.event.deleteMany({}); // Clear events that might depend on venues
        await prisma.venue.deleteMany({});

        const response = await request(app)
            .get(VENUES_ROUTE)
            .set('Authorization', `Bearer ${adminToken}`); // Using admin token

        expect(response.status).toBe(StatusCodes.OK);
        expect(response.body.payload.data).toBeInstanceOf(Array);
        expect(response.body.payload.data.length).toBe(0);

        // Re-seed for any subsequent tests if needed, or ensure each describe block has its own setup
        await prisma.venue.createMany({
            data: venueData,
            skipDuplicates: true,
        });
    });
});