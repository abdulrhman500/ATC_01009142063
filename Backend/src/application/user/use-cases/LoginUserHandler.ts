import { inject, injectable } from "inversify";
import { TYPES } from "@config/types";
import { IUserRepository } from "@domain/user/interfaces/IUserRepository";
import IPasswordHasher  from "@domain/user/interfaces/IPasswordHasher";
import { IJwtService, IJwtPayload } from "@domain/user/interfaces/IJwtService";
import User from "@domain/user/User";
import UserEmail from "@domain/user/value-objects/UserEmail";
import UserUsername from "@domain/user/value-objects/UserUsername";
import { LoginUserCommand } from "@application/user/commands/LoginUserCommand";
import { UnauthorizedException, NotFoundException } from "@shared/exceptions/http.exception"; // You'll need UnauthorizedException

export interface LoginResult {
    user: User;
    accessToken: string;
    expiresIn: number;
}

@injectable()
export default class LoginUserHandler {
    constructor(
        @inject(TYPES.IUserRepository) private readonly userRepository: IUserRepository,
        @inject(TYPES.IPasswordHasher) private readonly passwordHasher: IPasswordHasher,
        @inject(TYPES.IJwtService) private readonly jwtService: IJwtService
    ) {}

    public async execute(command: LoginUserCommand): Promise<LoginResult> {
        const { identifier, password } = command;

        console.log("Identifier:", identifier);
        console.log("Password:", password  );
        
        console.log("mvcccccccccccccccccccccc");
        
        let user: User | null = null;

        // Try finding user by email first, then by username if it looks like an email
        // A more robust way is to have separate fields or a clear indicator in the DTO
        if (identifier.includes('@')) {
            try {
                user = await this.userRepository.findByEmail(new UserEmail(identifier));
            } catch (e) { /* VO validation might fail, proceed to check as username */ }
        }

        if (!user) {
            try {
                user = await this.userRepository.findByUsername(new UserUsername(identifier));
            } catch (e) { /* VO validation might fail */ }
        }

        if (!user) {
            throw new UnauthorizedException("Invalid credentials.");
        }

        const isPasswordValid = await this.passwordHasher.verify(
            password,
            user.getHashedValue() // From User entity
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid credentials.");
            
        }

        // User is authenticated, generate JWT
        const jwtPayload: IJwtPayload = {
            userId: String(user.getId()!.getValue()), // Assuming UserId.getValue() is number
            username: user.getUsername().getValue(),
            role: user.getRole().getValue().toString(),
        };

        const { accessToken, expiresIn } = await this.jwtService.generateToken(jwtPayload);

        return {
            user,
            accessToken,
            expiresIn
        };
    }
}