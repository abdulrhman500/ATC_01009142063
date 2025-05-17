import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import {
    PrismaClient,
    User as PrismaUser,
    Role as PrismaRoleEnum,
    Venue as PrismaVenue,
} from '@prisma/client';
import { app } from '@src/main'; // Your configured Express app instance
import IPasswordHasher from '@domain/user/interfaces/IPasswordHasher';
import { Argon2PasswordHasher } from '@src/infrastructure/Argon2PasswordHasher';
import { IJwtPayload } from '@domain/user/interfaces/IJwtService';
import { RoleType as ActualRoleTypeEnum } from '@src/shared/RoleType';
import CreateVenueRequestDto from '@api/dtos/venue/CreateVenue/CreateVenueRequestDto'; // Adjust path if needed
import jwt from 'jsonwebtoken';

const API_ROOT_PATH = process.env.API_ROOT_PATH || '/api/v1';
const VENUES_ROUTE = `${API_ROOT_PATH}/venues`;

const prisma = new PrismaClient();
const passwordHasher: IPasswordHasher = new Argon2PasswordHasher();
// const jwtService = new JwtService(); // Using jwt.sign directly for simplicity

// Helper function to create a user
async function createUserForTest(username: string, email: string, role: PrismaRoleEnum, plainPassword?: string): Promise<PrismaUser> {
    const passwordHash = await passwordHasher.hash(plainPassword || 'Password123!');
    return prisma.user.upsert({
        where: { email },
        update: { role, password: passwordHash }, // Use 'password' field for hash
        create: {
            username, email, password: passwordHash, role,
            firstName: 'Test', middleName: 'Venue', lastName: role.toString(),
        }
    });
}

describe(`POST ${VENUES_ROUTE} (Create Venue - Integration)`, () => {
    let adminUser: PrismaUser;
    let customerUser: PrismaUser;
    let adminToken: string;
    let customerToken: string;

    beforeAll(async () => {
        adminUser = await createUserForTest('venue_admin', 'venue_admin@example.com', PrismaRoleEnum.admin, 'AdminPassSecure1!');
        customerUser = await createUserForTest('venue_customer', 'venue_customer@example.com', PrismaRoleEnum.customer, 'CustPassSecure1!');

        const adminPayload: IJwtPayload = { userId: String(adminUser.id), username: adminUser.username, role: adminUser.role as ActualRoleTypeEnum };
        const customerPayload: IJwtPayload = { userId: String(customerUser.id), username: customerUser.username, role: customerUser.role as ActualRoleTypeEnum };

        const jwtSecret = process.env.JWT_SECRET || 'fallback-test-secret-for-jest-atleast32chars';
        if (jwtSecret === 'fallback-test-secret-for-jest-atleast32chars') {
            console.warn("⚠️ Using fallback JWT secret for venue creation tests. Ensure JWT_SECRET is in .env.test");
        }

        adminToken = jwt.sign(adminPayload, jwtSecret, { expiresIn: '1h' });
        customerToken = jwt.sign(customerPayload, jwtSecret, { expiresIn: '1h' });
    });

    beforeEach(async () => {
        // Clean up venues that might conflict, especially if names are unique
        // This ensures each test starts with a predictable state for venue creation
        await prisma.event.deleteMany({}); // Delete events first if they have FK to Venue
        await prisma.venue.deleteMany({});
    });

    afterAll(async () => {
        await prisma.event.deleteMany({});
        await prisma.venue.deleteMany({});
        // Clean up users created specifically for this test suite if needed
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: 'venue_admin@example.com' },
                    { email: 'venue_customer@example.com' }
                ]
            }
        });
        await prisma.$disconnect();
    });

    const getValidVenuePayload = (): CreateVenueRequestDto => ({
        name: "The Grand Hall",
        street: "123 Festive Road",
        city: "Celebration City",
        state: "FL", // State is now mandatory
        country: "USA",
        postalCode: "54321",
        placeUrl: "http://example.com/grandhall"
    });

    it('should create a new venue successfully when authenticated as ADMIN (201)', async () => {
        const payload = getValidVenuePayload();

        const response = await request(app)
            .post(VENUES_ROUTE)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(payload);

        expect(response.status).toBe(StatusCodes.CREATED);
        expect(response.body.message).toBe("Venue created successfully.");
        expect(response.body.payload).toBeDefined();

        const venueDto = response.body.payload;
        expect(venueDto.id).toBeDefined();
        expect(venueDto.name).toBe(payload.name);
        expect(venueDto.street).toBe(payload.street);
        expect(venueDto.city).toBe(payload.city);
        expect(venueDto.state).toBe(payload.state);
        expect(venueDto.country).toBe(payload.country);

        // Verify in DB
        const dbVenue = await prisma.venue.findUnique({ where: { id: venueDto.id } });
        expect(dbVenue).not.toBeNull();
        expect(dbVenue?.name).toBe(payload.name);
        expect(dbVenue?.state).toBe(payload.state);
    });

    it('should return 403 Forbidden if authenticated user is not an ADMIN', async () => {
        const payload = getValidVenuePayload();
        const response = await request(app)
            .post(VENUES_ROUTE)
            .set('Authorization', `Bearer ${customerToken}`) // Using customer token
            .send(payload);

        expect(response.status).toBe(StatusCodes.FORBIDDEN);
        expect(response.body.message).toBe('You do not have sufficient permissions to access this resource.');
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
        const payload = getValidVenuePayload();
        const response = await request(app)
            .post(VENUES_ROUTE)
            .send(payload);

        expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
        expect(response.body.message).toMatch(/No token provided|Authentication required/i);
    });

    describe('Request DTO Validation (Create Venue)', () => {
        const basePayload = getValidVenuePayload();
        const invalidPayloadTemplates = [
            {
                description: "missing name",
                payload: { ...basePayload, name: undefined },
                field: "name", msgPart: /name is required/i
            },
            {
                description: "missing street",
                payload: { ...basePayload, street: undefined },
                field: "street", msgPart: /street address is required/i
            },
            {
                description: "missing city",
                payload: { ...basePayload, city: undefined },
                field: "city", msgPart: /city is required/i
            },
            {
                description: "missing state (now mandatory)",
                payload: { ...basePayload, state: undefined },
                field: "state", msgPart: /state is required/i
            },
            {
                description: "missing country",
                payload: { ...basePayload, country: undefined },
                field: "country", msgPart: /country is required/i
            },
            {
                description: "invalid placeUrl",
                payload: { ...basePayload, placeUrl: "not-a-url" },
                field: "placeUrl", msgPart: /valid URL/i
            },
        ];

        invalidPayloadTemplates.forEach(({ description, payload, field, msgPart }) => {
            it(`should return 400 BAD_REQUEST for ${description}`, async () => {
                const response = await request(app)
                    .post(VENUES_ROUTE)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(payload as any); // Use 'as any' to allow intentionally missing required fields

                expect(response.status).toBe(StatusCodes.BAD_REQUEST);
                expect(response.body.message).toMatch(/Validation failed/i);
               
            });
        });
    });

    it('should return 409 CONFLICT (or 400) if venue name already exists', async () => {
        const payload = getValidVenuePayload();
        // Create it once successfully
        await request(app)
            .post(VENUES_ROUTE)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(payload)
            .expect(StatusCodes.CREATED);

        // Attempt to create it again with the same name
        const response = await request(app)
            .post(VENUES_ROUTE)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(payload);

        // Prisma P2002 unique constraint violation should be handled
        // Your global error handler determines the exact status (e.g., 400 or 409) and message
        expect(response.status).toBe(StatusCodes.BAD_REQUEST); // Or CONFLICT, depending on ErrorHandler for P2002
        expect(response.body.message).toMatch(/already exists|unique constraint failed/i); // Adjust to your error handler's message
    });
});