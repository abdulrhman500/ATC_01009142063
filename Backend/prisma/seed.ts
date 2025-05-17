import { PrismaClient, Role as PrismaRoleEnum, User, Category, Venue, Event, Tag } from '@prisma/client';
// Adjust paths based on your actual project structure
import { Argon2PasswordHasher } from '../src/infrastructure/Argon2PasswordHasher';
import { RoleType } from '../src/shared/RoleType';
import Constants from '../src/shared/Constants';
import fs from 'fs';
import path from 'path';
import { Faker, en, base } from '@faker-js/faker';

const prisma = new PrismaClient();
const passwordHasher = new Argon2PasswordHasher();
const faker = new Faker({
    locale: [en, base], // Pass 'en' and 'base' as an array to the 'locale' option
  });


// --- Configuration for Seeding ---
const NUM_ADDITIONAL_ADMINS = 1; // Default admin + 1 more
const NUM_CUSTOMERS = 5;
const NUM_VENUES = 5;
const NUM_MAIN_CATEGORIES = 3; // e.g., Tech, Music, Sports (excluding General)
const NUM_CHILD_CATEGORIES_PER_PARENT = 2;
const NUM_EVENTS_TO_CREATE = 100;
const NUM_TAGS = 15;
const MAX_TAGS_PER_EVENT = 3;
const AVG_BOOKINGS_PER_CUSTOMER = 5;

const CREDENTIALS_FILE_PATH = path.join(__dirname, 'seeded_user_credentials.txt');
let seededCredentials: { username: string, plainPass: string }[] = [];

// Helper to store credentials before writing to file
function recordUserCredential(username: string, plainPassword) {
    seededCredentials.push({ username, plainPass: plainPassword });
}

function writeCredentialsToFile() {
    if (seededCredentials.length > 0) {
        const header = `--- SEEDED USER CREDENTIALS (FOR LOCAL TESTING ONLY - DO NOT COMMIT THIS FILE) ---
--- ${new Date().toISOString()} ---
Username:Password\n`;
        const content = seededCredentials.map(c => `${c.username}:${c.plainPass}`).join('\n');
        fs.writeFileSync(CREDENTIALS_FILE_PATH, header + content + "\n", { flag: 'w' }); // Overwrite/create
        console.log(`ℹ️ Plain text credentials for seeded users saved to: ${CREDENTIALS_FILE_PATH}`);
        console.warn(`SECURITY WARNING: '${path.basename(CREDENTIALS_FILE_PATH)}' contains plain text passwords. Ensure it is in .gitignore and used for local, isolated testing ONLY.`);
    }
}

async function seedUsers(): Promise<User[]> {
    console.log('Seeding users...');

    // 1. Default Admin User
    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@admin.com';
    const defaultAdminPlainPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';
    const defaultAdminHashedPassword = await passwordHasher.hash(defaultAdminPlainPassword);

    const adminUser = await prisma.user.upsert({
        where: { email: defaultAdminEmail },
        update: {
            username: defaultAdminUsername, // Ensure username is also updated if email matches but username differs
            password: defaultAdminHashedPassword,
            role: PrismaRoleEnum.admin,
        },
        create: {
            username: defaultAdminUsername,
            email: defaultAdminEmail,
            password: defaultAdminHashedPassword,
            firstName: 'Default',
            middleName: '',
            lastName: 'Admin',
            role: PrismaRoleEnum.admin,
        },
    });
    console.log(`✔️ Default admin user "${adminUser.username}" ensured/created.`);
    recordUserCredential(adminUser.username, defaultAdminPlainPassword);

    // 2. Additional Admins
    for (let i = 0; i < NUM_ADDITIONAL_ADMINS; i++) {
        const username = faker.internet.userName().toLowerCase() + `_admin${i}`;
        const email = faker.internet.email({ firstName: 'admin', lastName: `${i}` });
        const plainPassword = faker.internet.password({ length: 12 }) + "A1!";
        
        await prisma.user.upsert({
            where: { email },
            update: {username},
            create: {
                username, email, password: await passwordHasher.hash(plainPassword),
                firstName: faker.person.firstName(), middleName: "", lastName: faker.person.lastName(),
                role: PrismaRoleEnum.admin,
            },
        }).then(u => {
            console.log(`Created additional admin: ${u.username}`);
            recordUserCredential(u.username, plainPassword);
        }).catch(e => {
            if (e.code !== 'P2002') console.error(`Error creating additional admin ${username}: `, e)
            else console.log(`Admin ${username} or email ${email} likely exists.`)
        });
    }

    // 3. Customer Users
    for (let i = 0; i < NUM_CUSTOMERS; i++) {
        const username = faker.internet.userName().toLowerCase() + `_cust${i}`;
        const email = faker.internet.email({ firstName: 'customer', lastName: `${i}` });
        const plainPassword = faker.internet.password({ length: 10 }) + "c1!";
        
        await prisma.user.upsert({
            where: { email },
            update: {username},
            create: {
                username, email, password: await passwordHasher.hash(plainPassword),
                firstName: faker.person.firstName(), middleName: "", lastName: faker.person.lastName(),
                role: PrismaRoleEnum.customer,
            },
        }).then(u => {
            console.log(`Created customer: ${u.username}`);
            recordUserCredential(u.username, plainPassword);
        }).catch(e => {
            if (e.code !== 'P2002') console.error(`Error creating customer ${username}: `, e)
            else console.log(`Customer ${username} or email ${email} likely exists.`)
        });
    }
    return prisma.user.findMany();
}

async function seedCategories(): Promise<Category[]> {
    console.log('Seeding categories...');
    const generalCategory = await prisma.category.upsert({
        where: { name: Constants.GENERAL_CATEGORY_NAME },
        update: {},
        create: { name: Constants.GENERAL_CATEGORY_NAME, parentCategoryId: null },
    });
    console.log(`✔️ Default category "${generalCategory.name}" ensured/created.`);

    const mainCategoryNames = ['Technology', 'Music Concerts', 'Art & Culture', 'Sports Events', 'Food Festivals'];
    for (const name of mainCategoryNames.slice(0, NUM_MAIN_CATEGORIES)) {
        const parentCat = await prisma.category.upsert({
            where: { name }, update: {}, create: { name, parentCategoryId: null },
        });
        console.log(`Upserted parent category: ${parentCat.name}`);
        for (let i = 0; i < NUM_CHILD_CATEGORIES_PER_PARENT; i++) {
            const childName = `${faker.commerce.department()} under ${parentCat.name.substring(0,10)}`;
            await prisma.category.upsert({
                where: { name: childName }, update: {},
                create: { name: childName, parentCategoryId: parentCat.id },
            }).then(c => console.log(`  Upserted child category: ${c.name}`))
              .catch(e => { if (e.code !== 'P2002') console.error(`Error child category ${childName}: `, e) });
        }
    }
    return prisma.category.findMany();
}

async function seedVenues(): Promise<Venue[]> {
    console.log('Seeding venues...');
    for (let i = 0; i < NUM_VENUES; i++) {
        const name = `${faker.company.name()} ${faker.company.name()}`;
        await prisma.venue.upsert({
            where: { name }, update: {},
            create: {
                name,
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state({ abbreviated: true }),
                country: faker.location.countryCode('alpha-3'),
                postalCode: faker.location.zipCode(),
                placeUrl: faker.internet.url(),
            },
        }).then(v => console.log(`Upserted venue: ${v.name}`))
          .catch(e => { if (e.code !== 'P2002') console.error(`Error venue ${name}: `, e) });
    }
    return prisma.venue.findMany();
}

async function seedEvents(venues: Venue[], categories: Category[]): Promise<Event[]> {
    console.log('Seeding events...');
    if (venues.length === 0 || categories.length === 0) {
        console.warn('⚠️ No venues or categories available. Skipping event seeding.');
        return [];
    }

    for (let i = 0; i < NUM_EVENTS_TO_CREATE; i++) {
        const randomVenue = venues[faker.number.int({ min: 0, max: venues.length - 1 })];
        const randomCategory = categories[faker.number.int({ min: 0, max: categories.length - 1 })];
        const eventDate = faker.date.future({ years: 1 });

        await prisma.event.create({
            data: {
                name: faker.lorem.sentence(faker.number.int({min: 3, max: 7})).slice(0,-1), // 3-7 words, remove trailing period
                description: faker.lorem.paragraphs(2),
                date: eventDate,
                venueId: randomVenue.id,
                categoryId: randomCategory.id,
                priceValue: parseFloat(faker.commerce.price({ min: 5, max: 300 })),
                priceCurrency: faker.helpers.arrayElement(Constants.SUPPORTED_CURRENCIES as unknown as string[]),
                photoUrl: faker.image.urlLoremFlickr({ category: 'party' }),
                // No creatorId as per your requirements
            },
        }).catch(e => console.error(`Error creating event ${i}:`, e));
    }
    console.log(`✔️ Approximately ${NUM_EVENTS_TO_CREATE} events process attempted.`);
    return prisma.event.findMany();
}

async function seedTagsAndEventTags(events: Event[]) {
    console.log('Seeding tags and event-tag relations...');
    if (events.length === 0) return;
    const createdTags: Tag[] = [];
    for (let i = 0; i < NUM_TAGS; i++) {
        const tagName = faker.lorem.word({length: {min: 4, max: 10}, strategy: 'closest'});
        await prisma.tag.upsert({
            where: { name: tagName }, update: {}, create: { name: tagName },
        }).then(t => createdTags.push(t)).catch(e => { if (e.code !== 'P2002') console.error(`Error tag ${tagName}: `, e) });
    }

    if(createdTags.length === 0) {
        console.warn('No tags created/available. Skipping event-tag relations.');
        return;
    }

    for (const event of events) {
        const numTagsToAssign = faker.number.int({ min: 0, max: MAX_TAGS_PER_EVENT });
        const shuffledTags = faker.helpers.shuffle(createdTags);
        for (let i = 0; i < numTagsToAssign; i++) {
            if(shuffledTags[i]) {
                await prisma.eventTag.create({
                    data: { eventId: event.id, tagId: shuffledTags[i].id },
                }).catch(e => {
                    if (e.code !== 'P2002') console.error(`Error EventTag event ${event.id}-tag ${shuffledTags[i].id}:`, e);
                });
            }
        }
    }
    console.log('✔️ Tags and event-tag relations seeded.');
}

async function seedBookings(users: User[], events: Event[]) {
    console.log('Seeding bookings...');
    const customerUsers = users.filter(u => u.role === PrismaRoleEnum.customer);
    if (customerUsers.length === 0 || events.length === 0) {
        console.warn('⚠️ No customer users or events for booking. Skipping booking seeding.');
        return;
    }

    for (const customer of customerUsers) {
        const numBookings = faker.number.int({ min: 0, max: Math.min(AVG_BOOKINGS_PER_CUSTOMER, events.length) });
        const shuffledEvents = faker.helpers.shuffle(events);
        for (let i = 0; i < numBookings; i++) {
            if(shuffledEvents[i]) {
                await prisma.booking.create({
                    data: { userId: customer.id, eventId: shuffledEvents[i].id },
                }).catch(e => {
                    if (e.code !== 'P2002') console.error(`Error Booking user ${customer.id}-event ${shuffledEvents[i].id}:`, e);
                });
            }
        }
    }
    console.log('✔️ Bookings seeded.');
}

async function main() {
    console.log(`WARNING: This script will seed the database: ${process.env.DATABASE_URL}`);
    console.log(`It will create default users, categories, and ~100 events with related data.`);
    console.log(`Ensure this is the correct database before proceeding.`);
    // Consider adding a readline prompt here for production safety if this script were ever run against a live DB.
    // For local dev/test, automatic execution is usually fine.

    const users = await seedUsers();
    const categories = await seedCategories();
    const venues = await seedVenues();
    const events = await seedEvents(venues, categories);
    await seedTagsAndEventTags(events);
    await seedBookings(users, events);

    writeCredentialsToFile(); // Write all collected credentials at the end
}

main()
    .then(async () => {
        console.log("✅ Database seeding completed successfully.");
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ An error occurred during database seeding:", e);
        await prisma.$disconnect();
        process.exit(1);
    });