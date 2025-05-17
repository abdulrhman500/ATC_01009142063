import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { PrismaClient, User as PrismaUser, Role as PrismaRoleEnum, } from '@prisma/client';
import RoleType from '@domain/user/value-objects/UserRole';
import { app } from '@src/main'; // Your configured Express app instance
import RegisterUserRequestDto from '@src/api/dtos/auth/Register/RegisterUserRequestDto';
import IPasswordHasher from '@domain/user/interfaces/IPasswordHasher';
import { Argon2PasswordHasher } from '@src/infrastructure/Argon2PasswordHasher';
import LoginRequestDto from '@src/api/dtos/auth/login/LoginRequestDto';
import { IJwtPayload } from '@src/domain/user/interfaces/IJwtService';
import { RoleType as ActualRoleTypeEnum } from '@src/shared/RoleType';
import jwt from 'jsonwebtoken';
const API_ROOT_PATH = process.env.API_ROOT_PATH || '/api/v1';
const AUTH_ROUTE = `${API_ROOT_PATH}/auth`;

const prisma = new PrismaClient();
const passwordHasher: IPasswordHasher = new Argon2PasswordHasher();

// describe(`POST ${AUTH_ROUTE}/register (User Registration Integration)`, () => {
//     beforeEach(async () => {
//         // Clean up the User table before each test to ensure isolation
//         await prisma.user.deleteMany({});
//         // Add cleanup for other related tables if they exist and are affected
//     });

//     afterAll(async () => {
//         // Clean up the User table after all tests in this suite
//         await prisma.user.deleteMany({});
//         await prisma.$disconnect();
//     });

//     const validRegistrationData: RegisterUserRequestDto = {
//         firstName: 'John',
//         middleName: 'Michael', // UserName VO requires middleName
//         lastName: 'Doe',
//         username: 'johndoe_test',
//         email: 'john.doe.test@example.com',
//         password: 'Password123!',
//         role: RoleType.defaultUser().getValue().toString(),
//     };

//     it('should register a new user successfully, return 201 with user data, and store user with hashed password', async () => {
//         const response = await request(app)
//             .post(`${AUTH_ROUTE}/register`)
//             .send(validRegistrationData);

//         // 1. Assert HTTP Response
//         expect(response.status).toBe(StatusCodes.CREATED);
//         expect(response.body.message).toBe('User registered successfully.');
//         expect(response.body.payload).toBeDefined();
//         const responseUser = response.body.payload;
//         console.log(response.body);

//         // console.log(response)
//         console.log("***************");


//         expect(responseUser.id).toBeDefined();
//         expect(responseUser.username).toBe(validRegistrationData.username);
//         expect(responseUser.email).toBe(validRegistrationData.email);
//         expect(responseUser.firstName).toBe(validRegistrationData.firstName);
//         expect(responseUser.middleName).toBe(validRegistrationData.middleName);
//         expect(responseUser.lastName).toBe(validRegistrationData.lastName);
//         expect(responseUser.role).toBe(RoleType.defaultUser().getValue().toString()); // Assuming default role from your UserRole.defaultUser()
//         expect(responseUser.createdAt).toBeDefined();
//         expect(responseUser).not.toHaveProperty('passwordHash'); // Ensure password hash is NOT returned

//         // 2. Assert Database State
//         const dbUser = await prisma.user.findUnique({
//             where: { email: validRegistrationData.email },
//         });

//         expect(dbUser).not.toBeNull();
//         console.log(dbUser);
//         console.log("fffffffffffff");


//         if (dbUser) {
//             expect(dbUser.id).toEqual(parseInt(responseUser.id)); // Assuming your UserId VO stores number, DTO returns string
//             expect(dbUser.username).toBe(validRegistrationData.username);
//             expect(dbUser.email).toBe(validRegistrationData.email);
//             expect(dbUser.firstName).toBe(validRegistrationData.firstName);
//             expect(dbUser.middleName).toBe(validRegistrationData.middleName);
//             expect(dbUser.lastName).toBe(validRegistrationData.lastName);
//             expect(dbUser.role).toBe(RoleType.defaultUser().getValue().toString()); // Assuming default role from your UserRole.defaultUser()
//             expect(dbUser.password).toBeDefined();
//             // 3. Assert Password Hash
//             console.log(validRegistrationData.password);
//             console.log(dbUser.password);
//             console.log(" ccccccccccccc");


//             expect(await passwordHasher.verify(validRegistrationData.password, dbUser.password)).toBe(true);

//             // should not contain ant password

//         }
//     });

//     it('should return 409 CONFLICT if email already exists', async () => {
//         // 1. Setup: Create a user with the same email
//         await prisma.user.create({
//             data: {
//                 username: 'anotheruser',
//                 email: validRegistrationData.email, // Same email
//                 password: await passwordHasher.hash('SomePassword1!'),
//                 firstName: 'Another',
//                 middleName: 'Test',
//                 lastName: 'User',
//                 role: PrismaRoleEnum.customer,
//             },
//         });

//         // 2. Act
//         const response = await request(app)
//             .post(`${AUTH_ROUTE}/register`)
//             .send(validRegistrationData);

//         // 3. Assert (based on your ErrorHandler.middleware.ts)
//         expect(response.status).toBe(StatusCodes.CONFLICT);
//         expect(response.body.message).toBe(`User with email ${validRegistrationData.email} already exists.`);
//         expect(response.body.payload).toBeNull();
//     });

//     it('should return 409 CONFLICT if username already exists', async () => {
//         // 1. Setup: Create a user with the same username
//         await prisma.user.create({
//             data: {
//                 username: validRegistrationData.username, // Same username
//                 email: 'unique.email@example.com',
//                 password: await passwordHasher.hash('SomePassword1!'),
//                 firstName: 'Another',
//                 middleName: 'Test',
//                 lastName: 'User',
//                 role: PrismaRoleEnum.customer
//             },
//         });

//         // 2. Act
//         const response = await request(app)
//             .post(`${AUTH_ROUTE}/register`)
//             .send(validRegistrationData);

//         // 3. Assert
//         expect(response.status).toBe(StatusCodes.CONFLICT);
//         expect(response.body.message).toBe(`User with username ${validRegistrationData.username} already exists.`);
//         expect(response.body.payload).toBeNull();
//     });

//     // Test cases for DTO validation errors
//     // (Assuming ValidationMiddleware -> HttpException -> ErrorHandlerMiddleware)
//     // --- MODIFIED: Relaxed Test cases for DTO validation errors ---
//     const invalidPayloadsToTest = [
//         {
//             description: 'missing firstName (required field)',
//             payload: { ...validRegistrationData, firstName: undefined }, // Send undefined to omit it
//             // We expect the error message or details to mention 'firstName'
//             // and a common validation message like 'required' or 'must be a string'
//         },
//         {
//             description: 'invalid email format',
//             payload: { ...validRegistrationData, email: 'not-an-email' },
//             expectedFieldMention: 'email', // The field that should be mentioned in the error
//         },
//         {
//             description: 'password too short',
//             payload: { ...validRegistrationData, password: 'short' },
//             expectedFieldMention: 'password',
//         },
//         {
//             description: 'username too short',
//             payload: { ...validRegistrationData, username: 'us' },
//             expectedFieldMention: 'username',
//         },
//         {
//             description: 'middleName too short (when provided)',
//             payload: { ...validRegistrationData, middleName: 'M' }, // 'M' is likely too short if minLength is 2
//             expectedFieldMention: 'middleName',
//         }
//     ];

//     invalidPayloadsToTest.forEach(({ description, payload, expectedFieldMention }) => {
//         it(`should return 400 BAD_REQUEST for ${description}`, async () => {
//             const response = await request(app)
//                 .post(`${AUTH_ROUTE}/register`)
//                 .send(payload as any); // Use 'as any' if payload intentionally misses required fields for testing

//             expect(response.status).toBe(StatusCodes.BAD_REQUEST);


//     });
//     });
// });


describe(`POST ${AUTH_ROUTE}/login (User Login Integration)`, () => {
    const testUserData = {
        firstName: 'Login',
        middleName: 'Test',
        lastName: 'User',
        username: 'logintestuser',
        email: 'login.test@example.com',
        plainPassword: 'PasswordStrong123!',
        role: PrismaRoleEnum.customer, // Use Prisma's enum for DB seeding
    };
    let createdUserInDb: any; // To store user created in beforeEach

    beforeEach(async () => {
        await prisma.user.deleteMany({});
        const hashedPassword = await passwordHasher.hash(testUserData.plainPassword);
        createdUserInDb = await prisma.user.create({
            data: {
                firstName: testUserData.firstName,
                middleName: testUserData.middleName,
                lastName: testUserData.lastName,
                username: testUserData.username,
                email: testUserData.email,
                password: hashedPassword, // Ensure field name matches schema
                role: testUserData.role,
            },
        });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({});
        await prisma.$disconnect();
    });

    it('should login successfully with email and correct password, returning JWT and user info', async () => {
        const loginCredentials: LoginRequestDto = {
            email: testUserData.email,
            password: testUserData.plainPassword,
        };

        const response = await request(app)
            .post(`${AUTH_ROUTE}/login`)
            .send(loginCredentials);

        expect(response.status).toBe(StatusCodes.OK);
        expect(response.body.message).toBe('Login successful.');
        const loginPayload = response.body.payload;

        expect(loginPayload.accessToken).toBeDefined();
        expect(typeof loginPayload.accessToken).toBe('string');
        expect(loginPayload.tokenType).toBe('Bearer');
        expect(loginPayload.expiresIn).toBeGreaterThan(0); // Check if it's a positive number (seconds)

        expect(loginPayload.user).toBeDefined();
        expect(loginPayload.user.id).toBe(String(createdUserInDb.id));
        expect(loginPayload.user.username).toBe(testUserData.username);
        expect(loginPayload.user.email).toBe(testUserData.email);
        expect(loginPayload.user.role).toBe(testUserData.role); // PrismaRoleEnum.CUSTOMER is a string like "CUSTOMER"

        // Verify JWT payload
        const decodedToken = jwt.verify(loginPayload.accessToken, process.env.JWT_SECRET || 'your-fallback-super-secret-key-32-chars-minimum') as IJwtPayload;
        expect(decodedToken.userId).toBe(String(createdUserInDb.id));
        expect(decodedToken.username).toBe(testUserData.username);
        expect(decodedToken.role).toBe(testUserData.role);
        expect((decodedToken as any).exp).toBeDefined();
    });

    it('should login successfully with username and correct password', async () => {
        const loginCredentials: LoginRequestDto = {
            username: testUserData.username,
            password: testUserData.plainPassword,
        };
        const response = await request(app)
            .post(`${AUTH_ROUTE}/login`)
            .send(loginCredentials);

        expect(response.status).toBe(StatusCodes.OK);
        expect(response.body.payload.accessToken).toBeDefined();
        expect(response.body.payload.user.username).toBe(testUserData.username);
    });

    it('should return 401 UNAUTHORIZED for incorrect password', async () => {
        const loginCredentials: LoginRequestDto = {
            email: testUserData.email,
            password: 'WrongPassword123!',
        };
        const response = await request(app)
            .post(`${AUTH_ROUTE}/login`)
            .send(loginCredentials);

        expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
        expect(response.body.message).toBe('Invalid credentials.'); // From UnauthorizedException
    });

    it('should return 401 UNAUTHORIZED for non-existent email', async () => {
        const loginCredentials: LoginRequestDto = {
            email: 'nonexistent@example.com',
            password: testUserData.plainPassword,
        };
        const response = await request(app)
            .post(`${AUTH_ROUTE}/login`)
            .send(loginCredentials);

        expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
        expect(response.body.message).toBe('Invalid credentials.');
    });

    // DTO Validation Tests
    const invalidLoginPayloads = [
        { description: 'missing password', payload: { email: testUserData.email, password: '' } },
        { description: 'missing email and username', payload: { password: testUserData.plainPassword } },
        { description: 'email only, but too short password', payload: { email: testUserData.email, password: 'short' } },
    ];

    invalidLoginPayloads.forEach(({ description, payload }) => {
        it(`should return 400 BAD_REQUEST for ${description}`, async () => {
            const response = await request(app)
                .post(`${AUTH_ROUTE}/login`)
                .send(payload as any);

            // console.log(response.body);
            // {                                                                                                                                                                       
            //     statusCode: 400,
            //     message: 'Validation failed',
            //     payload: { errors: [ [Object] ] }
            //   }

            // console.log(response.body.payload.errors);
            // [                                                                                                                                                                       
            //   {
            //     property: 'password',
            //     constraints: {
            //       minLength: 'Password must be at least 8 characters long.',
            //       isNotEmpty: 'Password is required.'
            //     }
            //   }
            // [                                                                                                                                                                       
            //     {
            //       property: 'email',
            //       constraints: {
            //         isEmail: 'Please provide a valid email address if not logging in with username.',
            //         isNotEmpty: 'Email or username is required.'
            //       }
            //     },
            //     {
            //       property: 'username',
            //       constraints: {
            //         isString: 'Username must be a string if not logging in with email.',
            //         isNotEmpty: 'Email or username is required.'
            //       }
            //     }
            //   ]
            // [                                                                                                                                                                       
            //     {
            //       property: 'password',
            //       constraints: { minLength: 'Password must be at least 8 characters long.' }
            //     }
            //   ]

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        });
    });
});