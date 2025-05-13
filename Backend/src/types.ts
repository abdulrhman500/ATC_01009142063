// Define all dependency injection types in a separate file
// to avoid circular dependencies

export const TYPES = {
    IUserRepository: Symbol.for("IUserRepository"),
    RegisterUserHandler: Symbol.for("RegisterUserHandler"),
    PrismaClient: Symbol.for("PrismaClient"),
    IPasswordHasher: Symbol.for("IPasswordHasher"),
};