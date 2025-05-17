import request from 'supertest';
import { app } from '@src/main'; // Your Express app instance
import { PrismaClient, Category as PrismaCategory } from '@prisma/client'; // Import PrismaCategory for type hints
import { StatusCodes } from 'http-status-codes';
import CreateCategoryRequestDto from '@api/dtos/category/CreateCategory/CreateCategoryRequestDto';
import UpdateCategoryRequestDto from '@api/dtos/category/UpdateCategory/UpdateCategoryRequestDto';
import Constants from '@src/shared/Constants'; // For GENERAL_CATEGORY_NAME

const prisma = new PrismaClient();

// Use the API_ROOT_PATH from environment or default, consistent with main.ts
const API_ROOT_PATH = process.env.API_ROOT_PATH || '/api/v1';
const CATEGORY_ROUTE = `${API_ROOT_PATH}/category`;

describe(`Category Controller (Integration) - ${CATEGORY_ROUTE}`, () => {
    let generalCategory: PrismaCategory; // To store the "General" category

    beforeAll(async () => {
        // Ensure the "General" category exists for tests that rely on it (like delete)
        // This could also be part of a global seed script run by globalSetup if needed more widely
        generalCategory = await prisma.category.upsert({
            where: { name: Constants.GENERAL_CATEGORY_NAME},
            update: {},
            create: { name: Constants.GENERAL_CATEGORY_NAME, parentCategoryId: null },
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clean up database tables before each test to ensure isolation
        // Order matters due to foreign key constraints!
        await prisma.eventTag.deleteMany({});
        await prisma.booking.deleteMany({});
        await prisma.eventTranslation.deleteMany({});
        await prisma.event.deleteMany({});
        // Delete all categories EXCEPT the "General" category
        await prisma.category.deleteMany({
            where: {
                NOT: {
                    name: Constants.GENERAL_CATEGORY_NAME,
                },
            },
        });
        // Ensure "General" category is re-created if it was somehow deleted by a faulty test,
        // or if we want a truly fresh one (though upsert in beforeAll is better for a fixed one).
        // Re-asserting its existence after potential deleteMany.
        if (generalCategory?.id) {
             await prisma.category.upsert({ // ensure it exists with a null parentCategoryId
                where: { id: generalCategory.id },
                update: { parentCategoryId: null },
                create: { name: Constants.GENERAL_CATEGORY_NAME, parentCategoryId: null },
            });
        } else {
            // If generalCategory wasn't created in beforeAll for some reason.
             generalCategory = await prisma.category.upsert({
                where: { id: generalCategory.id || -1 },
                update: {},
                create: { name: Constants.GENERAL_CATEGORY_NAME, parentCategoryId: null },
            });
        }

        // Add other table cleanups as needed
        await prisma.tag.deleteMany({});
        await prisma.venue.deleteMany({});
        await prisma.user.deleteMany({});
    });

    // --- POST /category ---
    describe(`POST ${CATEGORY_ROUTE}`, () => {
        it('should create a new category successfully', async () => {
            const newCategoryData: CreateCategoryRequestDto = {
                name: 'Electronics',
                parentCategoryId: null,
            };
            const response = await request(app)
                .post(CATEGORY_ROUTE)
                .send(newCategoryData);
                                
            expect(response.status).toBe(StatusCodes.CREATED);
            expect(response.body.payload.id).toBeDefined();
            expect(response.body.payload.name).toBe(newCategoryData.name);
            expect(response.body.payload.parentCategoryId).toBeNull();
        });

        it('should return 400 Bad Request if name is missing for create', async () => {
            const response = await request(app)
                .post(CATEGORY_ROUTE)
                .send({ parentCategoryId: null }); // Missing name
            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        });
    });

//     // --- GET /category/:id ---
//     describe(`GET ${CATEGORY_ROUTE}/:id`, () => {
//         it('should get a category by its ID', async () => {
//             const category = await prisma.category.create({ data: { name: 'Books' } });
//             const response = await request(app)
//                 .get(`${CATEGORY_ROUTE}/${category.id}`);

//             expect(response.status).toBe(StatusCodes.OK);
//             expect(response.body.payload.id).toBe(String(category.id));
//             expect(response.body.payload.name).toBe('Books');
//         });

//         it('should return 404 for a non-existent category ID', async () => {
//             const response = await request(app).get(`${CATEGORY_ROUTE}/999999`);
//             expect(response.status).toBe(StatusCodes.NOT_FOUND);
//         });

//         it('should return 400 for an invalid ID format', async () => {
//             const response = await request(app).get(`${CATEGORY_ROUTE}/abc`);
//             expect(response.status).toBe(StatusCodes.BAD_REQUEST);
//         });
//     });

//     // --- GET /category (Paginated List) ---
//     describe(`GET ${CATEGORY_ROUTE}`, () => {
//         beforeEach(async () => {
//             await prisma.category.createMany({
//                 data: [
//                     { name: 'Category A' }, { name: 'Category B' }, { name: 'Category C' },
//                     { name: 'Category D' }, { name: 'Category E' },
//                 ],
//                 skipDuplicates: true, // In case "General" was one of these names
//             });
//         });

//         it('should get the first page of categories with default limit', async () => {
//             const response = await request(app).get(CATEGORY_ROUTE); // Default page=1, limit=10
//             expect(response.status).toBe(StatusCodes.OK);
//             const payload = response.body.payload;            
            
//             expect(payload.data.length).toBeLessThanOrEqual(10); // Will be 5 actual + "General" = 6
//             expect(payload.currentPage).toBe(1);
//             expect(payload.totalItems).toBe(5 + 1); // 5 created + General
//             expect(payload.itemsPerPage).toBe(10);
//         });

//         it('should get a specific page and limit of categories', async () => {
//             const response = await request(app).get(`${CATEGORY_ROUTE}?page=2&limit=2`);
//             expect(response.status).toBe(StatusCodes.OK);
//             const payload = response.body.payload;
//             expect(payload.data.length).toBeLessThanOrEqual(2);
//             expect(payload.currentPage).toBe(2);
//             expect(payload.itemsPerPage).toBe(2);
//             expect(payload.totalItems).toBe(5 + 1);
//             expect(payload.totalPages).toBe(Math.ceil((5+1)/2));
//         });

//         it('should return 400 for invalid pagination parameters (e.g., page=0)', async () => {
//              const response = await request(app).get(`${CATEGORY_ROUTE}?page=0`);
//              expect(response.status).toBe(StatusCodes.BAD_REQUEST);
//              // Add more specific error checking if your ValidationMiddleware provides details for query params
//         });
//     });
    

//     // --- GET /category/tree ---

// // Helper type for tree nodes in tests (matches CategoryTreeNodeDto structure)
// interface TestCategoryTreeNode {
//     id: string | null;
//     name: string;
//     parentId: string | null;
//     children: TestCategoryTreeNode[];
// }
//     describe(`GET ${CATEGORY_ROUTE}/tree`, () => {
//         it('should get categories as a hierarchical tree with correct details', async () => {
//             // 1. Setup: Create test categories
//             const parent1Db = await prisma.category.create({ data: { name: 'Parent1' } });
//             const child1_1Db = await prisma.category.create({ data: { name: 'Child1.1', parentCategoryId: parent1Db.id } });
//             const parent2Db = await prisma.category.create({ data: { name: 'Parent2' } });

//             // 2. Act: Call the endpoint
//             const response = await request(app).get(`${CATEGORY_ROUTE}/tree`);
            
//             // Optional: For debugging during test development
//             // console.log("Tree Response Body Payload:", JSON.stringify(response.body.payload, null, 2));

//             // 3. Assert: Check status and basic structure
//             expect(response.status).toBe(StatusCodes.OK);
//             expect(response.body.message).toBe("Category tree retrieved successfully"); // Assuming your ResponseEntity has a message
            
//             const payload = response.body.payload; // This is GetCategoryTreeResponseDto
//             expect(payload).toBeDefined();
//             expect(payload.data).toBeInstanceOf(Array);

//             // Convert root Prisma categories IDs to strings for comparison
//             const expectedParent1IdStr = String(parent1Db.id);
//             const expectedChild1_1IdStr = String(child1_1Db.id);
//             const expectedParent2IdStr = String(parent2Db.id);
//             const expectedGeneralIdStr = String(generalCategory.id);

//             // Find nodes in the response (type as TestCategoryTreeNode for better intellisense)
//             const rootNodes: TestCategoryTreeNode[] = payload.data;

//             const parent1Node = rootNodes.find(c => c.name === 'Parent1');
//             const parent2Node = rootNodes.find(c => c.name === 'Parent2');
//             const generalNode = rootNodes.find(c => c.name === Constants.GENERAL_CATEGORY_NAME);

//             // Assert Parent1 and its child
//             expect(parent1Node).toBeDefined();
//             if (parent1Node) {
//                 expect(parent1Node.id).toBe(expectedParent1IdStr);
//                 expect(parent1Node.parentId).toBeNull(); // Parent1 is a root
//                 expect(parent1Node.children).toBeInstanceOf(Array);
//                 expect(parent1Node.children.length).toBe(1);
                
//                 const child1_1Node = parent1Node.children[0];
//                 expect(child1_1Node.name).toBe('Child1.1');
//                 expect(child1_1Node.id).toBe(expectedChild1_1IdStr);
//                 expect(child1_1Node.parentId).toBe(expectedParent1IdStr); // Child's parentId matches Parent1's id
//                 expect(child1_1Node.children.length).toBe(0);
//             }

//             // Assert Parent2
//             expect(parent2Node).toBeDefined();
//             if (parent2Node) {
//                 expect(parent2Node.id).toBe(expectedParent2IdStr);
//                 expect(parent2Node.parentId).toBeNull(); // Parent2 is a root
//                 expect(parent2Node.children.length).toBe(0);
//             }

//             // Assert General Category
//             expect(generalNode).toBeDefined();
//             if (generalNode) {
//                 expect(generalNode.id).toBe(expectedGeneralIdStr);
//                 expect(generalNode.parentId).toBeNull(); // General is a root
//                 expect(generalNode.children.length).toBe(0);
//             }

//             // Assert total number of root nodes (adjust if other default categories might exist)
//             // Assuming only Parent1, Parent2, and General are roots in this test setup
//             expect(rootNodes.length).toBe(3);
//         });

//         it('should return an empty data array (only General category) if no other categories exist', async () => {
//             // No categories created other than 'General' from beforeAll/beforeEach

//             const response = await request(app).get(`${CATEGORY_ROUTE}/tree`);
//             expect(response.status).toBe(StatusCodes.OK);
            
//             const payload = response.body.payload;
//             expect(payload.data).toBeInstanceOf(Array);
//             expect(payload.data.length).toBe(1); // Only the "General" category

//             const generalNode = payload.data[0] as TestCategoryTreeNode;
//             expect(generalNode.name).toBe(Constants.GENERAL_CATEGORY_NAME);
//             expect(generalNode.id).toBe(String(generalCategory.id));
//             expect(generalNode.parentId).toBeNull();
//             expect(generalNode.children.length).toBe(0);
//         });

//         it('should handle a deeper category tree structure correctly', async () => {
//             // 1. Setup
//             const grandparentDb = await prisma.category.create({ data: { name: 'Grandparent' } });
//             const parentA_Db = await prisma.category.create({ data: { name: 'ParentA', parentCategoryId: grandparentDb.id } });
//             const childA1_Db = await prisma.category.create({ data: { name: 'ChildA1', parentCategoryId: parentA_Db.id } });
//             const childA2_Db = await prisma.category.create({ data: { name: 'ChildA2', parentCategoryId: parentA_Db.id } });
//             const parentB_Db = await prisma.category.create({ data: { name: 'ParentB', parentCategoryId: grandparentDb.id } });
//             const otherRootDb = await prisma.category.create({ data: { name: 'OtherRoot' } });

//             // 2. Act
//             const response = await request(app).get(`${CATEGORY_ROUTE}/tree`);
//             expect(response.status).toBe(StatusCodes.OK);

//             // 3. Assert
//             const rootNodes: TestCategoryTreeNode[] = response.body.payload.data;

//             // Find Grandparent (should be a root node if its parentId is null)
//             const grandparentRes = rootNodes.find(c => c.name === 'Grandparent');
//             expect(grandparentRes).toBeDefined();
//             if (!grandparentRes) return; // Type guard

//             expect(grandparentRes.id).toBe(String(grandparentDb.id));
//             expect(grandparentRes.parentId).toBeNull();
//             expect(grandparentRes.children.length).toBe(2); // ParentA and ParentB

//             // Find ParentA under Grandparent
//             const parentARes = grandparentRes.children.find(c => c.name === 'ParentA');
//             expect(parentARes).toBeDefined();
//             if (!parentARes) return;

//             expect(parentARes.id).toBe(String(parentA_Db.id));
//             expect(parentARes.parentId).toBe(String(grandparentDb.id));
//             expect(parentARes.children.length).toBe(2); // ChildA1 and ChildA2

//             // Find ChildA1 under ParentA
//             const childA1Res = parentARes.children.find(c => c.name === 'ChildA1');
//             expect(childA1Res).toBeDefined();
//             if (!childA1Res) return;
//             expect(childA1Res.id).toBe(String(childA1_Db.id));
//             expect(childA1Res.parentId).toBe(String(parentA_Db.id));
//             expect(childA1Res.children.length).toBe(0);

//             // Find ChildA2 under ParentA
//             const childA2Res = parentARes.children.find(c => c.name === 'ChildA2');
//             expect(childA2Res).toBeDefined();
//             if (!childA2Res) return;
//             expect(childA2Res.id).toBe(String(childA2_Db.id));
//             expect(childA2Res.parentId).toBe(String(parentA_Db.id));
//             expect(childA2Res.children.length).toBe(0);

//             // Find ParentB under Grandparent
//             const parentBRes = grandparentRes.children.find(c => c.name === 'ParentB');
//             expect(parentBRes).toBeDefined();
//             if (!parentBRes) return;
//             expect(parentBRes.id).toBe(String(parentB_Db.id));
//             expect(parentBRes.parentId).toBe(String(grandparentDb.id));
//             expect(parentBRes.children.length).toBe(0);

//             // Find OtherRoot
//             const otherRootRes = rootNodes.find(c => c.name === 'OtherRoot');
//             expect(otherRootRes).toBeDefined();
//             if (!otherRootRes) return;
//             expect(otherRootRes.id).toBe(String(otherRootDb.id));
//             expect(otherRootRes.parentId).toBeNull();
//             expect(otherRootRes.children.length).toBe(0);
            
//             // Find General category
//             const generalNode = rootNodes.find(c => c.name === Constants.GENERAL_CATEGORY_NAME);
//             expect(generalNode).toBeDefined();

//             // Expect 3 root nodes: Grandparent, OtherRoot, General
//             expect(rootNodes.length).toBe(3);
//         });
//     });
//     // --- PATCH /category/:id ---
//     describe(`PATCH ${CATEGORY_ROUTE}/:id`, () => {
//         it('should update a category name', async () => {
//             const category = await prisma.category.create({ data: { name: 'Old Name' } });
//             const updateData: UpdateCategoryRequestDto = { name: 'New Name Updated' };

//             const response = await request(app)
//                 .patch(`${CATEGORY_ROUTE}/${category.id}`)
//                 .send(updateData);

//             expect(response.status).toBe(StatusCodes.OK);
//             expect(response.body.payload.id).toBe(String(category.id));
//             expect(response.body.payload.name).toBe(updateData.name);

//             const dbCategory = await prisma.category.findUnique({ where: { id: category.id } });
//             expect(dbCategory?.name).toBe(updateData.name);
//         });

//         it('should update a category parentCategoryId', async () => {
//             const parent = await prisma.category.create({ data: { name: 'Future Parent' } });
//             const child = await prisma.category.create({ data: { name: 'Future Child', parentCategoryId: null } });
//             const updateData: UpdateCategoryRequestDto = { parentCategoryId: parent.id };

//             const response = await request(app)
//                 .patch(`${CATEGORY_ROUTE}/${child.id}`)
//                 .send(updateData);

//             expect(response.status).toBe(StatusCodes.OK);

            
            
//             const dbCategory = await prisma.category.findUnique({ where: { id: child.id } });
//             expect(dbCategory?.parentCategoryId).toBe(parent.id);
//         });

//         it('should return 404 when updating a non-existent category', async () => {
//             const response = await request(app)
//                 .patch(`${CATEGORY_ROUTE}/999999`)
//                 .send({ name: 'Wont Matter' });
//             expect(response.status).toBe(StatusCodes.NOT_FOUND);
//         });

//         it('should return 400 for invalid update data (e.g., empty name)', async () => {
//             const category = await prisma.category.create({ data: { name: 'Valid Category' } });
//             const response = await request(app)
//                 .patch(`${CATEGORY_ROUTE}/${category.id}`)
//                 .send({ name: '' }); // Empty name, should be caught by ValidationMiddleware
//             expect(response.status).toBe(StatusCodes.BAD_REQUEST);
//         });
//     });

//     // // --- DELETE /category/:id ---
//     describe(`DELETE ${CATEGORY_ROUTE}/:id`, () => {
//         let categoryToDelete: PrismaCategory;
//         let childCategory: PrismaCategory;

//         beforeEach(async () => {
//             categoryToDelete = await prisma.category.create({ data: { name: 'Category For Deletion' } });
//             childCategory = await prisma.category.create({ data: { name: 'Child of Deleted', parentCategoryId: categoryToDelete.id } });
//             // Note: Testing event reassignment would require creating events and IEventRepository interaction.
//             // For a "simple" test, we focus on category and child category reassignment.
//             // Ensure DeleteCategoryHandler can access a mock or real IEventRepository for this to fully pass without error.
//         });

//         it('should delete a category and reassign its children to General', async () => {
//             const response = await request(app)
//                 .delete(`${CATEGORY_ROUTE}/${categoryToDelete.id}`);
//             expect(response.status).toBe(StatusCodes.NO_CONTENT);

//             const deletedInDb = await prisma.category.findUnique({ where: { id: categoryToDelete.id } });
//             expect(deletedInDb).toBeNull();

//             const reparentedChild = await prisma.category.findUnique({ where: { id: childCategory.id } });
//             expect(reparentedChild?.parentCategoryId).toBe(generalCategory.id);
//         });

//         it('should return 404 when trying to delete a non-existent category', async () => {
//             const response = await request(app).delete(`${CATEGORY_ROUTE}/999999`);
//             expect(response.status).toBe(StatusCodes.NOT_FOUND);
//         });

//         it('should return 400 when trying to delete the "General" category', async () => {
//             const response = await request(app).delete(`${CATEGORY_ROUTE}/${generalCategory.id}`);
//             expect(response.status).toBe(StatusCodes.BAD_REQUEST);
//             expect(response.body.message).toContain(`The "${Constants.GENERAL_CATEGORY_NAME}" category cannot be deleted.`);
//         });
//     });
});