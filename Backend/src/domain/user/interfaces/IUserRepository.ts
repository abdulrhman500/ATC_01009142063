// @domain/user/interfaces/IUserRepository.ts
import User from "@domain/user/User";
import UserId from "@domain/user/value-objects/UserId";
import Email from "@domain/user/value-objects/UserEmail";
import Username from "@domain/user/value-objects/UserUsername";

export interface IUserRepository {
    findById(id: UserId): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
    findByUsername(username: Username): Promise<User | null>;
    save(user: User): Promise<User>;
    
}