import { RegisterUserCommand } from "@application/user/commands/RegisterUserCommand";
import IPasswordHasher from "@domain/user/interfaces/IPasswordHasher";
import { IUserRepository } from "@domain/user/interfaces/IUserRepository"; // Interface in Domain
import User from "@domain/user/User"; // Domain Entity
import Name from "@domain/user/value-objects/UserName";
import Email from "@domain/user/value-objects/UserEmail";
import Username from "@domain/user/value-objects/UserUsername";
import UserRole from "@domain/user/value-objects/UserRole";
import { inject, injectable } from "inversify";
import { TYPES } from "@src/types";

@injectable()
export class RegisterUserHandler {
    private readonly userRepository: IUserRepository;
    private readonly passwordHasher: IPasswordHasher;

    // Dependencies injected in the constructor
    constructor(
        @inject(TYPES.IUserRepository) userRepository: IUserRepository,
        @inject(TYPES.IPasswordHasher) passwordHasher: IPasswordHasher
    ){
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
    }

    public async execute(command: RegisterUserCommand): Promise<User> {
        // 1. Use Password Hashing Service from Infrastructure (via Domain Interface)
        const passwordHash = await this.passwordHasher.hash(command.password);

        // 2. Create Domain Value Objects (basic validation might happen in VOs constructors)
        const name = new Name(command.firstName, command.middleName, command.lastName);
        const email = new Email(command.email); // Email VO constructor validates format
        const username = new Username(command.username); // Username VO constructor validates format/rules
        const defaultRole = UserRole.defaultUser(); // Assuming a static factory method for roles
        const createdAt = new Date();

        // --- Potential Domain Service or Application Service Logic ---
        // Example: Check if email or username already exists (requires UserRepository)
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error("User with this email or username already exists.");
        }


        // 3. Create the User Domain Model using the Value Objects (including the hash)
        const newUser = new User(
            undefined,
            name,
            email,
            username,
            passwordHash,
            createdAt,
            defaultRole
        );

        // 4. Use the Repository (Domain Interface) to Save
        const savedUser: User = await this.userRepository.save(newUser);

        return savedUser;


    }
}
