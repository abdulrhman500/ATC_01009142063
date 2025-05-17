// @domain/user/User.ts

import Name from "@domain/user/value-objects/UserName";
import Email from "@domain/user/value-objects/UserEmail";
import Username from "@domain/user/value-objects/UserUsername";
import UserId from "@domain/user/value-objects/UserId";
import UserRole from "@domain/user/value-objects/UserRole";
import IPasswordHasher from "@domain/user/interfaces/IPasswordHasher";
export default class User {
    // Make properties private to enforce encapsulation
    private _id: UserId | undefined;
    private _name: Name;
    private _email: Email;
    private _username: Username;
    private _passwordHash: string;
    private _createdAt: Date;
    private _role: UserRole;

    // Constructor
    constructor(
        id: UserId | undefined,
        name: Name,
        email: Email,
        username: Username,
        passwordHash: string,
        createdAt: Date,
        role: UserRole,
    ) {
        // Basic check that essential value objects are provided
        if (!name || !email || !username || !passwordHash || !createdAt || !role) {
            throw new Error("User requires name, email, username, password hash, creation date, and role.");
        }

        this._id = id;
        this._name = name;
        this._email = email;
        this._username = username;
        this._passwordHash = passwordHash;
        this._createdAt = createdAt;
        this._role = role;
    }

    // Public getters to access state
    public getId(): UserId | undefined {
        return this._id;
    }

    public getName(): Name {
        return this._name;
    }

    public getEmail(): Email {
        return this._email;
    }

    public getUsername(): Username {
        return this._username;
    }


    public getCreatedAt(): Date {
        return this._createdAt;
    }

    public getRole(): UserRole {
        return this._role;
    }

    public getHashedValue(): string {
        return this._passwordHash;
    }

    public changePassword(newPasswordHash: string): void {
        // Example Business Rule: Cannot change password if user is locked out
        // This would require a 'lockedOut' state property, omitted for brevity.

        this._passwordHash = newPasswordHash;
    }

    public async verifyPassword(plainTextPassword: string, hasher: IPasswordHasher): Promise<boolean> {
        return hasher.verify(plainTextPassword, this._passwordHash);
    }

    public assignRole(newRole: UserRole): void {
        this._role = newRole;
    }
    public changeName(newName: Name) {
        this._name = newName;
    }

}