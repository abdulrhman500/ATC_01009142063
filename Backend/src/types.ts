// Define all dependency injection types in a separate file
// to avoid circular dependencies

export const TYPES = {
    IUserRepository: Symbol.for("IUserRepository"),
    RegisterUserHandler: Symbol.for("RegisterUserHandler"),
    PrismaClient: Symbol.for("PrismaClient"),
    IPasswordHasher: Symbol.for("IPasswordHasher"),
    ICategoryRepository: Symbol.for("ICategoryRepository"),
    CreateCategoryHandler: Symbol.for("CreateCategoryHandler"),
    GetCategoryTreeHandler: Symbol.for("GetCategoryTreeHandler"),
    UpdateCategoryHandler: Symbol.for("UpdateCategoryHandler"),
    IEventRepository: Symbol.for("IEventRepository"),
    DeleteCategoryHandler: Symbol.for("DeleteCategoryHandler"),
    GetAllCategoriesHandler: Symbol.for("GetAllCategoriesHandler"),
    GetCategoryByIdHandler : Symbol.for("GetCategoryByIdHandler"),
};