import { PrismaClient, Role as PrismaRoleEnum } from '@prisma/client';
// Adjust the import path based on your actual project structure
// Assuming Argon2PasswordHasher is in src/infrastructure/security/ or similar
import { Argon2PasswordHasher } from '../src/infrastructure/Argon2PasswordHasher';
import { RoleType } from '../src/shared/RoleType'; // Your RoleType enum
import Constants from '../src/shared/Constants'; // For GENERAL_CATEGORY_NAME

const prisma = new PrismaClient();
const passwordHasher = new Argon2PasswordHasher(); // Using your actual hasher

async function main() {
    console.log(`🌱 Starting database seeding...`);

    // --- Seed Default Admin User ---
    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@admin.com';
    // IMPORTANT: For production, use a strong, unique password from environment variables!
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';

    const existingAdmin = await prisma.user.findFirst({
        where: {
            OR: [
                { username: adminUsername },
                { email: adminEmail },
            ],
            // Optionally, be very specific and check if an ADMIN role user with these details exists
            // role: PrismaRoleEnum.ADMIN
        },
    });

    if (!existingAdmin) {
        const hashedPassword = await passwordHasher.hash(adminPassword);
        await prisma.user.create({
            data: {
                username: adminUsername,
                email: adminEmail,
                password: hashedPassword, // Using 'password' as per your confirmed schema field for the hash
                firstName: 'Default',
                middleName: '',         // Provide an empty string or null if your schema allows null
                lastName: 'Admin',
                role: PrismaRoleEnum.admin, // Use Prisma's generated enum for ADMIN
                // Other required fields with default values if necessary
                // createdAt and updatedAt are often auto-managed by Prisma (@default(now()), @updatedAt)
            },
        });
        console.log(`✔️ Default admin user "${adminUsername}" created successfully.`);
    } else {
        console.log(`ℹ️ Default admin user "${adminUsername}" already exists. Skipping.`);
    }

    // --- Seed Default "General" Category ---
    const generalCategoryName = Constants.GENERAL_CATEGORY_NAME; // From your shared constants
    const existingGeneralCategory = await prisma.category.findUnique({
        where: { name: generalCategoryName },
    });

    if (!existingGeneralCategory) {
        await prisma.category.create({
            data: {
                name: generalCategoryName,
                parentCategoryId: null, // Assuming it's a root category
            },
        });
        console.log(`✔️ Default category "${generalCategoryName}" created successfully.`);
    } else {
        console.log(`ℹ️ Default category "${generalCategoryName}" already exists. Skipping.`);
    }

    console.log(`🌿 Seeding finished.`);
}

main()
    .catch(async (e) => {
        console.error("❌ Error during seeding:", e);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });