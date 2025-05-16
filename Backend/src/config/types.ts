// Define all dependency injection types in a separate file
// to avoid circular dependencies

export const TYPES = {
    PrismaClient: Symbol.for("PrismaClient"),

    IUserRepository: Symbol.for("IUserRepository"),
    IEventRepository: Symbol.for("IEventRepository"),
    ICategoryRepository: Symbol.for("ICategoryRepository"),

    IPasswordHasher: Symbol.for("IPasswordHasher"),

    RegisterUserHandler: Symbol.for("RegisterUserHandler"),

    CreateCategoryHandler: Symbol.for("CreateCategoryHandler"),
    GetCategoryTreeHandler: Symbol.for("GetCategoryTreeHandler"),
    UpdateCategoryHandler: Symbol.for("UpdateCategoryHandler"),
    DeleteCategoryHandler: Symbol.for("DeleteCategoryHandler"),
    GetAllCategoriesHandler: Symbol.for("GetAllCategoriesHandler"),
    GetCategoryByIdHandler : Symbol.for("GetCategoryByIdHandler"),
};