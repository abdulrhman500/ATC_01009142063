import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import {
    PrismaClient,
    User as PrismaUser,
    Role as PrismaRoleEnum, // Assuming 'admin' and 'customer' are members
    Venue as PrismaVenue,
    Category as PrismaCategory,
    Event as PrismaEvent,
} from '@prisma/client';
import { app } from '@src/main'; // Your configured Express app instance
import IPasswordHasher from '@domain/user/interfaces/IPasswordHasher';
import { Argon2PasswordHasher } from '@src/infrastructure/Argon2PasswordHasher';
// import { JwtService } from '@src/infrastructure/security/JwtService'; // Using jwt.sign directly for simplicity
import { IJwtPayload } from '@domain/user/interfaces/IJwtService';
import { RoleType as ActualRoleTypeEnum } from '@src/shared/RoleType';
import CreateEventRequestDto from '@api/dtos/event/CreateEvent/CreateEventRequestDto'; // Adjust path if needed
import Constants from '@src/shared/Constants';
import jwt from 'jsonwebtoken'; // For signing test tokens

const API_ROOT_PATH = process.env.API_ROOT_PATH || '/api/v1';
const EVENTS_ROUTE = `${API_ROOT_PATH}/events`;

const prisma = new PrismaClient();
const passwordHasher: IPasswordHasher = new Argon2PasswordHasher();
// const jwtService = new JwtService(); // Can use this or jwt.sign directly for tests

// --- Helper Functions ---
async function createUser(username: string, email: string, role: PrismaRoleEnum, plainPassword?: string): Promise<PrismaUser> {
    const passwordHash = await passwordHasher.hash(plainPassword || 'Password123!');
    // Assuming your Prisma schema User model has 'password' field for the hash
    return prisma.user.create({
        data: {
            username, email, password: passwordHash, role,
            firstName: 'Test', middleName: 'User', lastName: role.toString(), // Ensure middleName matches schema (e.g., @default(""))
        }
    });
}

async function createVenue(name: string): Promise<PrismaVenue> {
    // This requires 'name' to be @unique in your Venue schema for upsert's where clause
    return prisma.venue.upsert({
        where: { name },
        update: {},
        create: { name, street: 'Default Test Street', city: 'Test City', state: 'TS', country: 'Testland' },
    });
}

async function createCategory(name: string, parentId?: number | null): Promise<PrismaCategory> {
    // This requires 'name' to be @unique in your Category schema for upsert's where clause
    return prisma.category.upsert({
        where: { name },
        update: {},
        create: { name, parentCategoryId: parentId },
    });
}
// --- End Helper Functions ---


describe(`POST ${EVENTS_ROUTE} (Create Event - Integration)`, () => {
    let adminUser: PrismaUser;
    let customerUser: PrismaUser;
    let adminToken: string;
    let customerToken: string;
    let testVenue: PrismaVenue;
    let testCategory: PrismaCategory;
    let generalCategory: PrismaCategory;

    beforeAll(async () => {
        // Create users
        adminUser = await createUser('event_creator_admin', 'event_creator_admin@example.com', PrismaRoleEnum.admin, 'AdminPass123!');
        customerUser = await createUser('event_creator_customer', 'event_creator_customer@example.com', PrismaRoleEnum.customer, 'CustPass123!');

        // Generate JWTs
        const adminPayload: IJwtPayload = { userId: String(adminUser.id), username: adminUser.username, role: adminUser.role as ActualRoleTypeEnum };
        const customerPayload: IJwtPayload = { userId: String(customerUser.id), username: customerUser.username, role: customerUser.role as ActualRoleTypeEnum };

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret || jwtSecret === 'your-fallback-super-secret-key-32-chars-minimum') {
            console.warn("⚠️ Using fallback or missing JWT_SECRET for createEvent tests. Ensure JWT_SECRET is in .env.test");
        }
        const secretToUse = jwtSecret || 'fallback-test-secret-for-jest-atleast32chars'; // Must be same as used by JwtService if not mocking

        adminToken = jwt.sign(adminPayload, secretToUse, { expiresIn: '1h' });
        customerToken = jwt.sign(customerPayload, secretToUse, { expiresIn: '1h' });

        // Create shared venue and category
        testVenue = await createVenue("Event Create Test Venue");
        testCategory = await createCategory("Event Create Test Category");
        generalCategory = await prisma.category.findUnique({where: {name: Constants.GENERAL_CATEGORY_NAME}}) 
            ?? await createCategory(Constants.GENERAL_CATEGORY_NAME); // Ensure general category exists
    });

    beforeEach(async () => {
        // Clean up events before each test to ensure isolation
        await prisma.booking.deleteMany({});
        await prisma.eventTag.deleteMany({});
        await prisma.eventTranslation.deleteMany({});
        await prisma.event.deleteMany({});
    });

    afterAll(async () => {
        // Clean up data created by this test suite
        await prisma.booking.deleteMany({});
        await prisma.eventTag.deleteMany({});
        await prisma.eventTranslation.deleteMany({});
        await prisma.event.deleteMany({});
        if (adminUser) await prisma.user.deleteMany({ where: { id: adminUser.id } });
        if (customerUser) await prisma.user.deleteMany({ where: { id: customerUser.id } });
        if (testCategory) await prisma.category.deleteMany({ where: { id: testCategory.id } });
        // Do not delete generalCategory if it's meant to be persistent or seeded globally
        if (testVenue) await prisma.venue.deleteMany({ where: { id: testVenue.id } });
        await prisma.$disconnect();
    });

    // Helper function to generate valid payload, now takes venue and category
    const getValidEventPayload = (currentVenue: PrismaVenue, currentCategory: PrismaCategory): CreateEventRequestDto => ({
        name: "Annual Developers Summit 2025",
        description: "A grand summit discussing the future of software development, AI, and new technologies.",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        venueId: currentVenue.id,
        categoryId: currentCategory.id,
        priceValue: 199.99,
        priceCurrency: "USD", // Ensure "USD" is in your Constants.SUPPORTED_CURRENCIES
        photoUrl: "http://example.com/images/dev_summit_2025.jpg" // Optional, but good to test
    });

    it('should create a new event successfully when authenticated as ADMIN (201)', async () => {
        const payload = getValidEventPayload(testVenue, testCategory);

        const response = await request(app)
            .post(EVENTS_ROUTE)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(payload);

        expect(response.status).toBe(StatusCodes.CREATED);
        expect(response.body.message).toBe("Event created successfully.");
        expect(response.body.payload).toBeDefined();

        const eventDto = response.body.payload;
        expect(eventDto.id).toBeDefined();
        expect(eventDto.name).toBe(payload.name);
        expect(eventDto.descriptionShort).toContain(payload.description.substring(0, 50));
        expect(new Date(eventDto.date).toISOString()).toBe(payload.date);
        expect(eventDto.venueName).toBe(testVenue.name);    // Assumes EventSummaryResponseDto maps venue.name
        expect(eventDto.categoryName).toBe(testCategory.name); // Assumes EventSummaryResponseDto maps category.name
        expect(eventDto.price).toBe(`${payload.priceValue.toFixed(2)} ${payload.priceCurrency}`);
        expect(eventDto.photoUrl).toBe(payload.photoUrl);
        expect(eventDto.isBooked).toBe(false); // New events are not booked by default

        // Verify in DB
        const dbEvent = await prisma.event.findUnique({ 
            where: { id: parseInt(eventDto.id) },
            include: { venue: true, category: true } 
        });
        expect(dbEvent).not.toBeNull();
        expect(dbEvent?.name).toBe(payload.name);
        expect(dbEvent?.venueId).toBe(payload.venueId);
        expect(dbEvent?.categoryId).toBe(payload.categoryId);
        // No creatorId check as per your request
    });

    it('should return 403 Forbidden if user is authenticated but not an ADMIN', async () => {
        const payload = getValidEventPayload(testVenue, testCategory);
        const response = await request(app)
            .post(EVENTS_ROUTE)
            .set('Authorization', `Bearer ${customerToken}`) // Using customer token
            .send(payload);

        expect(response.status).toBe(StatusCodes.FORBIDDEN);
        expect(response.body.message).toBe('You do not have sufficient permissions to access this resource.');
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
        const payload = getValidEventPayload(testVenue, testCategory);
        const response = await request(app)
            .post(EVENTS_ROUTE)
            .send(payload);

        expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
        // The exact message depends on your isAuthenticated middleware if it throws specific message or generic one
        expect(response.body.message).toMatch(/No token provided|Authentication required/i);
    });

    describe('Request DTO Validation', () => {
        // Templates for invalid payloads. Payloads are generated inside 'it' block.
        const invalidPayloadTemplates = [
            {
                description: "empty name", field: "name", msgPart: /name is required|name must be a string/i,
                getPayload: () => ({ ...getValidEventPayload(testVenue, testCategory), name: "" })
            },
            {
                description: "name too short", field: "name", msgPart: /name must be at least 3 characters/i,
                getPayload: () => ({ ...getValidEventPayload(testVenue, testCategory), name: "AB" })
            },
            {
                description: "invalid date format", field: "date", msgPart: /valid ISO 8601 date string/i,
                getPayload: () => ({ ...getValidEventPayload(testVenue, testCategory), date: "invalid-date-format" })
            },
            {
                description: "venueId not an integer", field: "venueId", msgPart: /Venue ID must be an integer/i,
                getPayload: () => ({ ...getValidEventPayload(testVenue, testCategory), venueId: "abc" as any })
            },
            {
                description: "negative price", field: "priceValue", msgPart: /Price value cannot be negative/i,
                getPayload: () => ({ ...getValidEventPayload(testVenue, testCategory), priceValue: -10 })
            },
            {
                description: "invalid currency", field: "priceCurrency", msgPart: new RegExp(`Currency must be one of: ${Constants.SUPPORTED_CURRENCIES.join(', ')}`, "i"),
                getPayload: () => ({ ...getValidEventPayload(testVenue, testCategory), priceCurrency: "BTC" })
            },
            {
                description: "invalid photoUrl", field: "photoUrl", msgPart: /Photo URL must be a valid URL/i,
                getPayload: () => ({ ...getValidEventPayload(testVenue, testCategory), photoUrl: "not-a-valid-url" })
            },
        ];

        invalidPayloadTemplates.forEach(({ description, field, msgPart, getPayload }) => {
            it(`should return 400 BAD_REQUEST for ${description}`, async () => {
                const payload = getPayload(); // Generate payload inside the test case

                const response = await request(app)
                    .post(EVENTS_ROUTE)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(payload);

                expect(response.status).toBe(StatusCodes.BAD_REQUEST);
                expect(response.body.message).toMatch(/Validation failed/i);
            });
        });
    });

    it('should return 400 BAD_REQUEST if referenced venueId does not exist', async () => {
        const payload = { ...getValidEventPayload(testVenue, testCategory), venueId: 999999 };
        const response = await request(app)
            .post(EVENTS_ROUTE)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(payload);

        expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        expect(response.body.message).toBe('Venue with ID 999999 not found.'); // Message from CreateEventHandler
    });

    it('should create an event successfully if optional categoryId is not provided', async () => {
        const payload = { ...getValidEventPayload(testVenue, testCategory), categoryId: undefined };
        // delete payload.categoryId; // Or ensure it's explicitly undefined

        const response = await request(app)
            .post(EVENTS_ROUTE)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(payload);

        expect(response.status).toBe(StatusCodes.CREATED);
        expect(response.body.payload.name).toBe(payload.name);
        expect(response.body.payload.categoryName).toBeUndefined();

        const dbEvent = await prisma.event.findUnique({ where: { id: parseInt(response.body.payload.id) } });
        expect(dbEvent?.categoryId).toBeNull();
    });

     it('should return 400 BAD_REQUEST if provided categoryId does not exist', async () => {
        const payload = { ...getValidEventPayload(testVenue, testCategory), categoryId: 888888 };
        const response = await request(app)
            .post(EVENTS_ROUTE)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(payload);

        expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        expect(response.body.message).toBe('Category with ID 888888 not found.'); // Message from CreateEventHandler
    });
});