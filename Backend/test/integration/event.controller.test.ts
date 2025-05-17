import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { PrismaClient, Category as PrismaCategory, Venue as PrismaVenue, Event as PrismaEvent, Role as PrismaRoleEnum } from '@prisma/client';
import { app } from '@src/main'; // Your configured Express app instance
import Constants from '@src/shared/Constants'; // For GENERAL_CATEGORY_NAME
import GetAllEventsRequestDto from '@api/dtos/event/GetAllEvents/GetAllEventsRequestDto'; // For type hints if needed
import { RoleType } from '@src/shared/RoleType';


const API_ROOT_PATH = process.env.API_ROOT_PATH || '/api/v1';
const EVENTS_ROUTE = `${API_ROOT_PATH}/events`;
const CATEGORY_ROUTE = `${API_ROOT_PATH}/category`; // For creating categories if needed

const prisma = new PrismaClient();

// Helper function to create a category (if not using global seed for all categories)
async function createCategory(name: string, parentId?: number): Promise<PrismaCategory> {
    return prisma.category.create({
        data: {
            name,
            parentCategoryId: parentId,
        },
    });
}

// Helper function to create a venue
async function createVenue(name: string): Promise<PrismaVenue> {
    return prisma.venue.create({
        data: {
            name,
            street: '123 Main St',
            city: 'Testville',
            state: 'TS',
            country: 'Testland',
        },
    });
}

// Helper function to create an event
interface TestEventData {
    name: string;
    description: string;
    date: Date;
    venueId: number;
    categoryId?: number | null;
    priceValue?: number;
    priceCurrency?: string;
    photoUrl?: string;
}
async function createEvent(data: TestEventData): Promise<PrismaEvent> {
    return prisma.event.create({
        data: {
            name: data.name,
            description: data.description,
            date: data.date,
            venueId: data.venueId,
            categoryId: data.categoryId,
            priceValue: data.priceValue ?? 50, // Default price
            priceCurrency: data.priceCurrency ?? 'USD', // Default currency
            photoUrl: data.photoUrl ?? 'http://example.com/photo.jpg', // Default photo
        },
    });
}


describe(`GET ${EVENTS_ROUTE} (List Events - Integration)`, () => {
    let venue1: PrismaVenue;
    let categoryTech: PrismaCategory, categoryMusic: PrismaCategory, categoryConcerts: PrismaCategory, categoryWorkshops: PrismaCategory;
    let categorySports: PrismaCategory, categoryFootball: PrismaCategory, categoryArt: PrismaCategory;
    let generalCategory: PrismaCategory;

    beforeAll(async () => {
        // Initial setup for all tests in this describe block
        venue1 = await createVenue('Main Hall');

        // Create some base categories
        categoryTech = await createCategory('Technology');
        categoryMusic = await createCategory('Music');
        categorySports = await createCategory('Sports'); // New
        categoryArt = await createCategory('Art');  

        categoryConcerts = await createCategory('Concerts', categoryMusic.id); // Child of Music
        categoryWorkshops = await createCategory('Workshops', categoryTech.id); // Child of Technology
        categoryFootball = await createCategory('Football', categorySports.id); // // Child of Sports
        generalCategory = await prisma.category.upsert({ // Ensure General category
            where: { name: Constants.GENERAL_CATEGORY_NAME },
            update: {},
            create: { name: Constants.GENERAL_CATEGORY_NAME, parentCategoryId: null },
        });
    });

    beforeEach(async () => {
        // Clean events before each test, categories and venues can persist for the suite
        // or be cleaned if tests interfere. For listing, usually just events need cleaning.
        await prisma.eventTag.deleteMany({});
        await prisma.booking.deleteMany({});
        await prisma.eventTranslation.deleteMany({});
        await prisma.event.deleteMany({});
    });

    afterAll(async () => {
        // Full cleanup after all tests in this suite
        await prisma.eventTag.deleteMany({});
        await prisma.booking.deleteMany({});
        await prisma.eventTranslation.deleteMany({});
        await prisma.event.deleteMany({});
        await prisma.category.deleteMany({
            where: { name: { not: Constants.GENERAL_CATEGORY_NAME } },
        });
        await prisma.venue.deleteMany({});
        await prisma.$disconnect();
    });

    describe('Basic Pagination', () => {
        beforeEach(async () => {
            // Seed 15 events for pagination tests
            for (let i = 1; i <= 15; i++) {
                await createEvent({
                    name: `Event ${i}`,
                    description: `Description for event ${i}`,
                    date: new Date(2025, 10, i + 1), // Future dates
                    venueId: venue1.id,
                    categoryId: categoryTech.id,
                });
            }
        });

        it('should return the first page with default limit (10 items)', async () => {
            const response = await request(app).get(EVENTS_ROUTE);
            console.log(response.body);
            console.log("*-----------------");
            

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.payload.data.length).toBe(10);
            expect(response.body.payload.currentPage).toBe(1);
            expect(response.body.payload.itemsPerPage).toBe(10);
            expect(response.body.payload.totalItems).toBe(15);
            expect(response.body.payload.totalPages).toBe(2); // Math.ceil(15/10)
        });

        it('should return the specified page and limit', async () => {
            const response = await request(app).get(`${EVENTS_ROUTE}?page=2&limit=5`);

            console.log(response.body);
            console.log("*-----------------");   
            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.payload.data.length).toBe(5);
            expect(response.body.payload.currentPage).toBe(2);
            expect(response.body.payload.itemsPerPage).toBe(5);
            expect(response.body.payload.totalItems).toBe(15);
            expect(response.body.payload.totalPages).toBe(3); // Math.ceil(15/5)
            expect(response.body.payload.data[0].name).toBe('Event 10'); // decs orde based on date r
        });

        it('should return an empty data array for a page out of bounds', async () => {
            const response = await request(app).get(`${EVENTS_ROUTE}?page=4&limit=5`); // Total items 15, totalPages = 3
            // console.log(response.body);
            // {                                                                                                                                                                       
            //     statusCode: 200,
            //     message: 'Events retrieved successfully.',
            //     payload: {
            //       data: [],
            //       totalItems: 15,
            //       currentPage: 4,
            //       itemsPerPage: 5,
            //       totalPages: 3
            //     }

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.payload.data.length).toBe(0);
            expect(response.body.payload.currentPage).toBe(4);
            expect(response.body.payload.itemsPerPage).toBe(5);
            expect(response.body.payload.totalItems).toBe(15);
            expect(response.body.payload.totalPages).toBe(3);
        });

        it('should return 400 for invalid page or limit parameters', async () => {
            let response = await request(app).get(`${EVENTS_ROUTE}?page=0`);
            expect(response.status).toBe(StatusCodes.BAD_REQUEST);

            response = await request(app).get(`${EVENTS_ROUTE}?limit=0`);
            expect(response.status).toBe(StatusCodes.BAD_REQUEST);

            response = await request(app).get(`${EVENTS_ROUTE}?limit=200`); //  max limit is 100
            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        });
    });

    describe('Text Search (`textSearch`)', () => {
        beforeEach(async () => {
            await createEvent({ name: 'Awesome Tech Conference', description: 'A conference about new tech.', date: new Date(2025, 11, 1), venueId: venue1.id, categoryId: categoryTech.id });
            await createEvent({ name: 'Music Festival Fun', description: 'Live music and bands.', date: new Date(2025, 11, 5), venueId: venue1.id, categoryId: categoryMusic.id });
            await createEvent({ name: 'Tech Workshop Day', description: 'Hands-on coding workshop.', date: new Date(2025, 11, 10), venueId: venue1.id, categoryId: categoryWorkshops.id });
        });

        it('should find events matching text in name', async () => {
            const response = await request(app).get(`${EVENTS_ROUTE}?textSearch=Tech`);
            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.payload.data.length).toBe(2);
            expect(response.body.payload.data.some((event: any) => event.name === 'Awesome Tech Conference')).toBe(true);
            expect(response.body.payload.data.some((event: any) => event.name === 'Tech Workshop Day')).toBe(true);
        });

        it('should find events matching text in description', async () => {
            const response = await request(app).get(`${EVENTS_ROUTE}?textSearch=conference`);
            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.payload.data.length).toBe(1);
            expect(response.body.payload.data[0].name).toBe('Awesome Tech Conference');
        });

        it('should return empty data if textSearch matches no events', async () => {
            const response = await request(app).get(`${EVENTS_ROUTE}?textSearch=NonExistentTerm`);
            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.payload.data.length).toBe(0);
            expect(response.body.payload.totalItems).toBe(0);
        });

        it('should combine textSearch with pagination', async () => {
            await createEvent({ name: 'Another Tech Talk', description: 'More tech discussions', date: new Date(2025, 11, 15), venueId: venue1.id, categoryId: categoryTech.id });
            // Now 3 events with "Tech"
            const response = await request(app).get(`${EVENTS_ROUTE}?textSearch=Tech&page=1&limit=1`);
            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.payload.data.length).toBe(1);
            expect(response.body.payload.totalItems).toBe(3);
            expect(response.body.payload.totalPages).toBe(3);
        });
    });


    describe('Category Filtering (including children)', () => {
        // This beforeEach will seed data for ALL tests within THIS describe block
        beforeEach(async () => {
            // Tech Tree
            await createEvent({ name: 'AI Workshop', description: 'Deep dive into AI', date: new Date(2025, 10, 5), venueId: venue1.id, categoryId: categoryWorkshops.id });
            await createEvent({ name: 'Generic Tech Event', description: 'General technology', date: new Date(2025, 10, 6), venueId: venue1.id, categoryId: categoryTech.id });
            
            // Music Tree
            await createEvent({ name: 'Rock Concert', description: 'Loud Guitars', date: new Date(2025, 10, 7), venueId: venue1.id, categoryId: categoryConcerts.id });
            await createEvent({ name: 'Jazz Night', description: 'Smooth Jazz', date: new Date(2025, 10, 8), venueId: venue1.id, categoryId: categoryMusic.id });
            
            // Sports Tree - Adding these for the new tests
            await createEvent({ name: 'Football Match', description: 'Local derby', date: new Date(2025, 11, 1), venueId: venue1.id, categoryId: categoryFootball.id });
            await createEvent({ name: 'Sports Gala', description: 'Annual sports meet', date: new Date(2025, 11, 2), venueId: venue1.id, categoryId: categorySports.id });

            // Art Category - Adding this for the new tests
            await createEvent({ name: 'Art Exhibition', description: 'Modern art', date: new Date(2025, 11, 3), venueId: venue1.id, categoryId: categoryArt.id });
            
            // Uncategorized & General
            await createEvent({ name: 'Uncategorized Event', description: 'No category', date: new Date(2025, 10, 9), venueId: venue1.id, categoryId: null });
            await createEvent({ name: 'General Category Event', description: 'Belongs to General', date: new Date(2025, 10, 10), venueId: venue1.id, categoryId: generalCategory.id });
        });

        // --- Your existing and new category filter tests ---
        it('should filter by category names, including events from child categories (Music)', async () => {
            const response = await request(app).get(`${EVENTS_ROUTE}?categoryNames=Music`);
            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.payload.totalItems).toBe(2); // Rock Concert, Jazz Night
            const eventNames = response.body.payload.data.map((e: any) => e.name);
            expect(eventNames).toContain('Rock Concert');
            expect(eventNames).toContain('Jazz Night');
        });

        it('should combine multiple category filters (IDs for Tech, Names for Music) and include children', async () => {
            // Tech tree (2 events) + Music tree (2 events) = 4 events
            const response = await request(app).get(`${EVENTS_ROUTE}?categoryIds=${categoryTech.id}&categoryNames=Music`);
            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.payload.totalItems).toBe(4);
            const receivedEventNames = response.body.payload.data.map((event: any) => event.name);
            const expectedEventNames = ['AI Workshop', 'Generic Tech Event', 'Rock Concert', 'Jazz Night'];
            expect(receivedEventNames.sort()).toEqual(expectedEventNames.sort());
        });

        it('should return empty data if filtering by a category with no events', async () => {
            const emptyCat = await createCategory('Truly Empty Category'); // Create a new one for this test
            const response = await request(app).get(`${EVENTS_ROUTE}?categoryIds=${emptyCat.id}`);
            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.payload.data.length).toBe(0);
            expect(response.body.payload.totalItems).toBe(0);
            // Clean up the specific category created for this test to avoid interference
            await prisma.category.delete({ where: { id: emptyCat.id }});
        });
        
        it('should filter by multiple category IDs AND names, including all descendants (Tech ID, Music Name, Art Name)', async () => {
            const expectedEventNames = [
                'AI Workshop', 'Generic Tech Event', // Technology Tree
                'Rock Concert', 'Jazz Night',       // Music Tree
                'Art Exhibition'                    // Art Category
            ];
            const expectedTotal = expectedEventNames.length; // 5 events

            const response = await request(app)
                .get(`${EVENTS_ROUTE}?categoryIds=${categoryTech.id}&categoryNames=Music,Art`);

            expect(response.status).toBe(StatusCodes.OK);
            const payload = response.body.payload;
            expect(payload.totalItems).toBe(expectedTotal);
            // If not paginating for this test, data.length should also be expectedTotal
            // If default pagination (10 items) is active, this is fine.
            expect(payload.data.length).toBe(expectedTotal); 

            const receivedEventNames = payload.data.map((event: any) => event.name);
            expect(receivedEventNames.sort()).toEqual(expectedEventNames.sort());
        });

        it('should filter by multiple category IDs (Technology, Music), including descendants', async () => {
            const expectedEventNames = ['AI Workshop', 'Generic Tech Event', 'Rock Concert', 'Jazz Night']; // 4 events
            const response = await request(app).get(`${EVENTS_ROUTE}?categoryIds=${categoryTech.id},${categoryMusic.id}`);
            
            expect(response.status).toBe(StatusCodes.OK);
            const payload = response.body.payload;
            expect(payload.totalItems).toBe(4);
            expect(payload.data.length).toBe(4);
            const receivedEventNames = payload.data.map((event: any) => event.name);
            expect(receivedEventNames.sort()).toEqual(expectedEventNames.sort());
        });

        it('should filter by multiple category names (Sports, Art), including descendants', async () => {
            const expectedEventNames = ['Football Match', 'Sports Gala', 'Art Exhibition']; // 3 events
            const response = await request(app).get(`${EVENTS_ROUTE}?categoryNames=Sports,Art`);

            expect(response.status).toBe(StatusCodes.OK);
            const payload = response.body.payload;
            expect(payload.totalItems).toBe(3);
            expect(payload.data.length).toBe(3);
            const receivedEventNames = payload.data.map((event: any) => event.name);
            expect(receivedEventNames.sort()).toEqual(expectedEventNames.sort());
        });
    });
    describe('Combined Filters', () => {
        beforeEach(async () => {
            await createEvent({ name: 'Advanced AI Tech Workshop', description: 'AI advancements', date: new Date(2025, 10, 5), venueId: venue1.id, categoryId: categoryWorkshops.id }); // Child of Tech
            await createEvent({ name: 'Beginner Tech Workshop', description: 'Intro to tech', date: new Date(2025, 10, 6), venueId: venue1.id, categoryId: categoryWorkshops.id }); // Child of Tech
            await createEvent({ name: 'Tech Conference Keynote', description: 'Keynote on tech', date: new Date(2025, 10, 7), venueId: venue1.id, categoryId: categoryTech.id }); // Parent Tech
        });

        it('should filter by textSearch AND categoryId (including children)', async () => {
            // Search "Workshop" within "Technology" category (which includes "Workshops" child category)
            const response = await request(app).get(`${EVENTS_ROUTE}?textSearch=Workshop&categoryIds=${categoryTech.id}`);
            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body.payload.totalItems).toBe(2); // Advanced AI Tech Workshop, Beginner Tech Workshop
            expect(response.body.payload.data.every((e: any) => e.name.includes('Workshop'))).toBe(true);
        });
    });
});