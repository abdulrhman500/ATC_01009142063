import RegisterUserCommand from "@application/user/commands/RegisterUserCommand";
import IPasswordHasher from "@domain/user/interfaces/IPasswordHasher";
import { IUserRepository } from "@domain/user/interfaces/IUserRepository"; // Interface in Domain
import User from "@domain/user/User"; // Domain Entity
import Name from "@domain/user/value-objects/UserName";
import Email from "@domain/user/value-objects/UserEmail";
import Username from "@domain/user/value-objects/UserUsername";
import UserRole from "@domain/user/value-objects/UserRole";
import { inject, injectable } from "inversify";
import { TYPES } from "@src/config/types";
import UserAlreadyExistException from "@domain/user/exceptions/UserAlreadyExistException";

@injectable()
export class RegisterUserHandler {
    private readonly userRepository: IUserRepository;
    private readonly passwordHasher: IPasswordHasher;

    // Dependencies injected in the constructor
    constructor(
        @inject(TYPES.IUserRepository) userRepository: IUserRepository,
        @inject(TYPES.IPasswordHasher) passwordHasher: IPasswordHasher
    ) {
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
        const defaultRole = UserRole.defaultUser();
        const createdAt = new Date();



        // Check for existing user by email
        const existingUserByEmail = await this.userRepository.findByEmail(email);
        if (existingUserByEmail) {
            throw new UserAlreadyExistException(`User with email ${command.email} already exists.`);
        }

        // Check for existing user by username
        const existingUserByUsername = await this.userRepository.findByUsername(username);
        if (existingUserByUsername) {
            throw new UserAlreadyExistException(`User with username ${command.username} already exists.`);
        }
   

        const newUser = new User(
            undefined,
            name,
            email,
            username,
            passwordHash,
            createdAt,
            defaultRole
        );

        const savedUser: User = await this.userRepository.save(newUser);

        return savedUser;


    }
}
