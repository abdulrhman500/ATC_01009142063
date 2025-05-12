import Name from "@value-objects/user/UserName";
import Email from "@value-objects/user/UserEmail";
import Username from "@value-objects/user/UserUsername";
import UserId from "@value-objects/user/UserId";

export default class User {
    readonly id: UserId;
    readonly name: Name;
    readonly email: Email;
    readonly username: Username;
    readonly createdAt: Date;

    /**
     * Private constructor to force usage of the Builder for creating User instances.
     * @param id - The user's unique identifier.
     * @param name - The user's name (Value Object).
     * @param email - The user's email (Value Object).
     * @param username - The user's username (Value Object).
     * @param createdAt - The date/time the user was created.
     */
    private constructor(id: UserId, name: Name, email: Email, username: Username, createdAt: Date = new Date()) {

        this.id = id;
        this.name = name;
        this.email = email;
        this.username = username;
        this.createdAt = createdAt;
    }


    /**
     * Builder class for constructing User instances.
     * @class
     */
    public static Builder = class UserBuilder {
        private id: UserId | undefined;
        private name: Name | undefined;
        private email: Email | undefined;
        private username: Username | undefined;
        private createdAt: Date | undefined;

        setId(id: UserId): UserBuilder {
            this.id = id;
            return this;
        }

        setName(name: Name): UserBuilder {
            this.name = name;
            return this;
        }

        setEmail(email: Email): UserBuilder {
            this.email = email;
            return this;
        }

        setUsername(username: Username): UserBuilder {
            this.username = username;
            return this;
        }

        setCreatedAt(date: Date): UserBuilder {
            this.createdAt = date;
            return this;
        }
        build(): User {
            // --- Validation happens in the Builder before creating the User ---
            if (this.id == null || this.name == null || this.email == null || this.username == null) {
                throw new Error("UserBuilder requires id, name, email, and username to be set before building.");
            }

            // --- Create and return the User object using its private constructor ---
            return new User(this.id, this.name, this.email, this.username, this.createdAt);
        }
    }
}