// @application/user/use-cases/RegisterUserUseCase.ts
import { injectable, inject } from "inversify"; // Assuming Inversify for DI
import { IUserRepository } from "@domain/user/interfaces/IUserRepository";
import User from "@domain/user/User";
import UserAlreadyExistException from "@domain/user/exceptions/UserAlreadyExistException"; // Use the domain exception
import { RegisterUserCommand } from "@application/user/commands/RegisterUserCommand";
import Name from "@domain/user/value-objects/UserName";
import Email from "@domain/user/value-objects/UserEmail";
import Username from "@domain/user/value-objects/UserUsername";
import UserId from "@domain/user/value-objects/UserId";
import { TYPES } from "@src/inversify.config"; // Assuming you have Inversify types

// In a real app, you might have a domain service for password hashing
// and a utility for generating UUIDs (possibly from Infrastructure/Shared layer)
// For simplicity here, let's assume a uuid utility is available.
import { v4 as uuidv4 } from 'uuid'; // Example UUID generator

@injectable()
export class RegisterUserUseCase {
    private userRepository: IUserRepository;
    // private passwordHasher: IPasswordHasher; // Example domain service interface

    constructor(
        @inject(TYPES.IUserRepository) userRepository: IUserRepository,
        // @inject(TYPES.IPasswordHasher) passwordHasher: IPasswordHasher
    ) {
        this.userRepository = userRepository;
        // this.passwordHasher = passwordHasher;
    }

    /**
     * Executes the user registration use case.
     * @param command - The registration command data.
     * @returns The newly created User domain entity.
     * @throws UserAlreadyExistException if the email or username is already taken.
     */
    public async execute(command: RegisterUserCommand): Promise<User> {
        // 1. Check for existing user
        const existingUser = await this.userRepository.findByEmail(new Email(command.email))
                             || await this.userRepository.findByUsername(new Username(command.username));

        if (existingUser) {
            throw new UserAlreadyExistException();
        }

        // 2. Create Value Objects from command data
        const userId = new UserId(1); // Generate a new ID (Application or Domain service could do this)
        const name = new Name(command.firstName, command.middleName, command.lastName); // Assuming Name is a Value Object
        const email = new Email(command.email);
        const username = new Username(command.username);
        // const hashedPassword = await this.passwordHasher.hash(command.password); // Use domain service

        // 3. Create the User Domain Entity using the Builder
        const newUser = new User.Builder()
            .setId(userId) // Pass Value Object
            .setName(name) // Pass Value Object
            .setEmail(email) // Pass Value Object
            .setUsername(username) // Pass Value Object
            // .setPassword(hashedPassword) // If password was part of the User entity
            .build(); // The builder handles internal validation

        // 4. Save the User Entity via the Repository interface
        // The Infrastructure layer implementation of save() will map the User entity
        // to the database object and persist it.
        const savedUser = await this.userRepository.save(newUser);

        // 5. Return the result (the saved Domain Entity)
        return savedUser;
    }
}