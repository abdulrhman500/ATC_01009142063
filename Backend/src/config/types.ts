// Define all dependency injection types in a separate file
// to avoid circular dependencies

export const TYPES = {
    PrismaClient: Symbol.for("PrismaClient"),

    IUserRepository: Symbol.for("IUserRepository"),
    IEventRepository: Symbol.for("IEventRepository"),
    ICategoryRepository: Symbol.for("ICategoryRepository"),
    IBookingRepository: Symbol.for("IBookingRepository"),
    IVenueRepository: Symbol.for("IVenueRepository"),
    
    IPasswordHasher: Symbol.for("IPasswordHasher"),

    IJwtService: Symbol.for("IJwtService"),

    RegisterUserHandler: Symbol.for("RegisterUserHandler"),
    LoginUserHandler : Symbol.for("LoginUserHandler"),

    
    CreateCategoryHandler: Symbol.for("CreateCategoryHandler"),
    GetCategoryTreeHandler: Symbol.for("GetCategoryTreeHandler"),
    UpdateCategoryHandler: Symbol.for("UpdateCategoryHandler"),
    DeleteCategoryHandler: Symbol.for("DeleteCategoryHandler"),
    GetAllCategoriesHandler: Symbol.for("GetAllCategoriesHandler"),
    GetCategoryByIdHandler : Symbol.for("GetCategoryByIdHandler"),
    
    GetAllEventsHandler: Symbol.for("GetAllEventsHandler"),

};