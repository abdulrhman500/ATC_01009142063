// import { app } from '@src/main';
// import request from 'supertest';
// import { PrismaClient } from '@prisma/client';

// describe('AuthController Integration Tests', () => {
//   const prisma = new PrismaClient();

//   beforeAll(async () => {
//     await prisma.$connect();
//   });

//   afterAll(async () => {
//     await prisma.$disconnect();
//   });

//   beforeEach(async () => {
//     await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE;');
//   });

//   describe('POST /auth/register', () => {
//     it('should register new user with valid data', async () => {
//       const response = await request(app)
//         .post('/auth/register')
//         .send({
//           firstName: 'John',
//           lastName: 'Doe',
//           email: 'john.doe@example.com',
//           username: 'johndoe',
//           password: 'SecurePass123!'
//         });

//       expect(response.status).toBe(201);
//       expect(response.body.data).toHaveProperty('id');
//     });

//     it('should return 400 with validation details for invalid payload', async () => {
//       const testCases = [
//         {
//           payload: { 
//             lastName: 'Doe',
//             email: 'invalid-email',
//             username: 'user',
//             password: 'short' 
//           },
//           expectedErrors: ['firstName', 'email', 'password']
//         },
//         {
//           payload: {
//             firstName: 'J'.repeat(51),
//             lastName: 'D'.repeat(51),
//             email: 'valid@email.com',
//             username: 'u',
//             password: 'noSpecialChar1'
//           },
//           expectedErrors: ['firstName', 'lastName', 'username', 'password']
//         }
//       ];

//       for (const testCase of testCases) {
//         const response = await request(app)
//           .post('/auth/register')
//           .send(testCase.payload);

//         expect(response.status).toBe(400);
//         expect(response.body.errors.some((e: any) => 
//           testCase.expectedErrors.includes(e.property)
//         )).toBe(true);
//       }
//     });

//     it('should return 409 conflict for duplicate email and username', async () => {
//       // First registration
//       await request(app)
//         .post('/auth/register')
//         .send({
//           firstName: 'Existing',
//           lastName: 'User',
//           email: 'existing@example.com',
//           username: 'existinguser',
//           password: 'SecurePass123!'
//         });

//       // Duplicate registration
//       const response = await request(app)
//         .post('/auth/register')
//         .send({
//           firstName: 'John',
//           lastName: 'Doe',
//           email: 'existing@example.com',
//           username: 'existinguser',
//           password: 'SecurePass123!'
//         });

//       expect(response.status).toBe(409);
//       expect(response.body.message).toMatch(/already exists/i);
//     });

//     it('should return 409 for duplicate username/email', async () => {
//       // Create existing user first
//       await prisma.user.create({
//         data: {
//           firstName: 'Existing',
//           lastName: 'User',
//           email: 'existing@example.com',
//           username: 'existinguser',
//           password: 'HashWillBeGenerated',
//           role: 'customer'
//         }
//       });

//       const response = await request(app)
//         .post('/auth/register')
//         .send({
//           firstName: 'John',
//           lastName: 'Doe',
//           email: 'existing@example.com',
//           username: 'existinguser',
//           password: 'SecurePass123!'
//         });

//       expect(response.status).toBe(409);
//     });
//   });
// });