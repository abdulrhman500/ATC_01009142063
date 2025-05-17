import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import {
    PrismaClient,
    Category as PrismaCategory, // Assuming you might need to create categories for specific events
    Venue as PrismaVenue,
    Event as PrismaEvent,
    Role as PrismaRoleEnum,
    User as PrismaUser,
    Booking as PrismaBooking, // Import Booking if you create/check bookings directly
} from '@prisma/client';
import { app } from '@src/main'; // Your configured Express app instance
import Constants from '@src/shared/Constants'; // If needed for GENERAL_CATEGORY_NAME etc.
import { RoleType as ActualRoleTypeEnum } from '@src/shared/RoleType';
import { JwtService } from '@src/infrastructure/security/JwtService'; // For generating test tokens
import IPasswordHasher from '@domain/user/interfaces/IPasswordHasher';
import { Argon2PasswordHasher } from '@src/infrastructure/Argon2PasswordHasher';
import { IJwtPayload } from '@src/domain/user/interfaces/IJwtService';
import jwt from 'jsonwebtoken'; // For verifying token in tests if needed, or if jwtService doesn't expose verify for test purposes

const API_ROOT_PATH = process.env.API_ROOT_PATH || '/api/v1';
const EVENTS_ROUTE = `${API_ROOT_PATH}/events`;

const prisma = new PrismaClient();
const jwtService = new JwtService(); // For generating tokens for tests
const passwordHasher: IPasswordHasher = new Argon2PasswordHasher();

// --- Helper Functions (Consider moving to a shared test utility file if used across multiple test files) ---
async function createVenue(name: string): Promise<PrismaVenue> {
    return prisma.venue.create({
        data: { name, street: '123 Test St', city: 'Testville', state: 'TS', country: 'Testland' },
    });
}

interface TestEventData {
    name: string; description: string; date: Date; venueId: number;
    categoryId?: number | null; priceValue?: number; priceCurrency?: string; photoUrl?: string;
}
async function createEvent(data: TestEventData): Promise<PrismaEvent> {
    return prisma.event.create({
        data: {
            name: data.name, description: data.description, date: data.date, venueId: data.venueId,
            categoryId: data.categoryId, priceValue: data.priceValue ?? 50,
            priceCurrency: data.priceCurrency ?? 'USD', photoUrl: data.photoUrl ?? 'http://example.com/photo.jpg',
        },
    });
}

async function createUser(username: string, email: string, role: PrismaRoleEnum, plainPassword?: string): Promise<PrismaUser> {
    const password = await passwordHasher.hash(plainPassword || 'Password123!');
    return prisma.user.create({
        data: {
            username, email, password, role,
            firstName: 'Test', middleName: 'User', lastName: role.toString(), // Use role string for lastName
        }
    });
}
// --- End Helper Functions ---

describe(`GET ${EVENTS_ROUTE} - Logged-in User Scenarios (isBooked flag)`, () => {
    let venue1: PrismaVenue;
    let customerUser: PrismaUser;
    let adminUser: PrismaUser;
    let customerToken: string;
    let adminToken: string;
    let event1: PrismaEvent, event2: PrismaEvent, event3: PrismaEvent;

    beforeAll(async () => {
        venue1 = await createVenue('Test Venue Hall'); // Unique name for these tests

        // Create users and generate tokens once for this test suite
        customerUser = await createUser('booker_isbooked', 'booker_isbooked@example.com', PrismaRoleEnum.customer, 'Password123!');
        adminUser = await createUser('admin_isbooked_checker', 'admin_isbooked@example.com', PrismaRoleEnum.admin, 'Password123!');

        const customerPayload: IJwtPayload = { userId: String(customerUser.id), username: customerUser.username, role: customerUser.role as ActualRoleTypeEnum };
        const adminPayload: IJwtPayload = { userId: String(adminUser.id), username: adminUser.username, role: adminUser.role as ActualRoleTypeEnum };

        // Ensure JWT_SECRET is loaded in test env (e.g. via setupFilesAfterEnv loading .env.test)
        if (!process.env.JWT_SECRET) {
            console.warn("JWT_SECRET not set for tests, using fallback. THIS IS INSECURE.");
        }
        const secret = process.env.JWT_SECRET || 'your-fallback-super-secret-key-for-testing_at_least_32_chars_long';

        customerToken = jwt.sign(customerPayload, secret, { expiresIn: '1h' });
        adminToken = jwt.sign(adminPayload, secret, { expiresIn: '1h' });
    });

    beforeEach(async () => {
        // Clean and re-seed events and bookings for each test in this block
        await prisma.booking.deleteMany({});
        await prisma.event.deleteMany({});

        event1 = await createEvent({ name: 'Bookable Event Alpha', description: 'Alpha event', date: new Date(2025, 10, 10), venueId: venue1.id });
        event2 = await createEvent({ name: 'Bookable Event Bravo', description: 'Bravo event', date: new Date(2025, 10, 11), venueId: venue1.id });
        event3 = await createEvent({ name: 'Bookable Event Charlie', description: 'Charlie event', date: new Date(2025, 10, 12), venueId: venue1.id });
    });

    afterAll(async () => {
        // Clean up data created by this test suite
        await prisma.booking.deleteMany({});
        await prisma.event.deleteMany({});
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { id: customerUser?.id },
                    { id: adminUser?.id }
                ]
            }
        });
        await prisma.venue.deleteMany({ where: { id: venue1?.id }});
        await prisma.$disconnect();
    });

    it('should show isBooked as false for all events for a GUEST user', async () => {
        const response = await request(app).get(`${EVENTS_ROUTE}?limit=3`);
        expect(response.status).toBe(StatusCodes.OK);
        const events = response.body.payload.data as any[];
        expect(events.length).toBe(3);
        events.forEach(event => {
            expect(event.isBooked).toBe(false);
        });
    });

    it('should show isBooked as false for all events for an ADMIN user', async () => {
        const response = await request(app)
            .get(`${EVENTS_ROUTE}?limit=3`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(StatusCodes.OK);
        const events = response.body.payload.data as any[];
        expect(events.length).toBe(3);
        events.forEach(event => {
            expect(event.isBooked).toBe(false);
        });
    });

    it('should show isBooked as false for a CUSTOMER who has made no bookings for these events', async () => {
        const response = await request(app)
            .get(`${EVENTS_ROUTE}?limit=3`)
            .set('Authorization', `Bearer ${customerToken}`);

        expect(response.status).toBe(StatusCodes.OK);
        const events = response.body.payload.data as any[];
        expect(events.length).toBe(3);
        events.forEach(event => {
            expect(event.isBooked).toBe(false);
        });
    });

    it('should correctly show isBooked for a CUSTOMER with some bookings', async () => {
        // Customer books event1 and event3
        await prisma.booking.create({ data: { userId: customerUser.id, eventId: event1.id } });
        await prisma.booking.create({ data: { userId: customerUser.id, eventId: event3.id } });

        // Assuming default order by date asc: event1, event2, event3
        // (adjust if your default repository order is different)
        const response = await request(app)
            .get(`${EVENTS_ROUTE}?limit=3`)
            .set('Authorization', `Bearer ${customerToken}`);

            console.log(response.body.payload.data);
            console.log("fffffffffffdsffvsdfdfdf");
            
            
        expect(response.status).toBe(StatusCodes.OK);
        const events = response.body.payload.data as any[];
        expect(events.length).toBe(3);

        const event1Dto = events.find(e => e.name === 'Bookable Event Alpha');
        const event2Dto = events.find(e => e.name === 'Bookable Event Bravo');
        const event3Dto = events.find(e => e.name === 'Bookable Event Charlie');

        expect(event1Dto?.isBooked).toBe(true);
        expect(event2Dto?.isBooked).toBe(false);
        expect(event3Dto?.isBooked).toBe(true);
    });

    it('should handle pagination correctly with isBooked status for a CUSTOMER (assuming date desc order)', async () => {
        // Events created in beforeEach:
        // event1 (Alpha) - Nov 10
        // event2 (Bravo) - Nov 11
        // event3 (Charlie) - Nov 12
        // Additional events for this test:
        const event4 = await createEvent({ name: 'Bookable Event Delta', description: 'Delta event', date: new Date(2025, 10, 13), venueId: venue1.id }); // Nov 13
        const event5 = await createEvent({ name: 'Bookable Event Echo', description: 'Echo event', date: new Date(2025, 10, 14), venueId: venue1.id }); // Nov 14

        // Current order from API (date: 'desc'): Event5, Event4, Event3, Event2, Event1

        // Customer books event1 (Alpha - will be on page 3) and event4 (Delta - will be on page 1)
        await prisma.booking.create({ data: { userId: customerUser.id, eventId: event1.id } });
        await prisma.booking.create({ data: { userId: customerUser.id, eventId: event4.id } });

        // Request page 1, limit 2 (should get event5, event4)
        let responsePage1 = await request(app)
            .get(`${EVENTS_ROUTE}?page=1&limit=2`) // Assuming default sort is date:desc from repo
            .set('Authorization', `Bearer ${customerToken}`);

        expect(responsePage1.status).toBe(StatusCodes.OK);
        let page1Events = responsePage1.body.payload.data as any[];
        // console.log("Page 1 Events (desc order):", page1Events.map(e => ({ name: e.name, isBooked: e.isBooked })));
        
        expect(page1Events.length).toBe(2);
        expect(page1Events.find(e => e.name === event5.name)?.isBooked).toBe(false); // Event Echo (event5) was not booked
        expect(page1Events.find(e => e.name === event4.name)?.isBooked).toBe(true);  // Event Delta (event4) was booked

        // Request page 2, limit 2 (should get event3, event2)
        let responsePage2 = await request(app)
            .get(`${EVENTS_ROUTE}?page=2&limit=2`)
            .set('Authorization', `Bearer ${customerToken}`);

        expect(responsePage2.status).toBe(StatusCodes.OK);
        let page2Events = responsePage2.body.payload.data as any[];
        // console.log("Page 2 Events (desc order):", page2Events.map(e => ({ name: e.name, isBooked: e.isBooked })));

        expect(page2Events.length).toBe(2);
        expect(page2Events.find(e => e.name === event3.name)?.isBooked).toBe(false); // Event Charlie (event3) was not booked
        expect(page2Events.find(e => e.name === event2.name)?.isBooked).toBe(false); // Event Bravo (event2) was not booked

        // Request page 3, limit 2 (should get event1)
        let responsePage3 = await request(app)
            .get(`${EVENTS_ROUTE}?page=3&limit=2`)
            .set('Authorization', `Bearer ${customerToken}`);

        expect(responsePage3.status).toBe(StatusCodes.OK);
        let page3Events = responsePage3.body.payload.data as any[];
        // console.log("Page 3 Events (desc order):", page3Events.map(e => ({ name: e.name, isBooked: e.isBooked })));

        expect(page3Events.length).toBe(1); // Only event1 left
        expect(page3Events.find(e => e.name === event1.name)?.isBooked).toBe(true);  // Event Alpha (event1) was booked
    });
});