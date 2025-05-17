// @infrastructure/security/Argon2PasswordHasher.ts

import { injectable } from "inversify";
import * as argon2 from 'argon2';
import IPasswordHasher from "@domain/user/interfaces/IPasswordHasher";

@injectable()
export class Argon2PasswordHasher implements IPasswordHasher {

    public async hash(password: string): Promise<string> {

        const hashedPassword = await argon2.hash(password);

        return hashedPassword;
    }

    public async verify(plainTextPassword: string, storedHash: string): Promise<boolean> {
        const isValid = await argon2.verify(storedHash,plainTextPassword);
        return isValid;
    }
}