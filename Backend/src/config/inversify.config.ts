

import { Container } from "inversify"; // Import Container
import { IUserRepository } from "@domain/user/interfaces/IUserRepository"; // Import IUserRepository interface
import { UserRepository } from "@infrastructure/db/UserRepository"; // Import UserRepository implementation
import { RegisterUserHandler } from "@src/application/user/use-cases/RegisterUserHandler"; // Import RegisterUserUseCase
import { PrismaClient } from "@prisma/client";
import {Argon2PasswordHasher} from "@infrastructure/Argon2PasswordHasher";
import IPasswordHasher from "@domain/user/interfaces/IPasswordHasher";
import CategoryRepository from "@infrastructure/db/CategoryRepository";
import ICategoryRepository from "@domain/category/interfaces/ICategoryRepository";

import { TYPES } from "@config/types";
import GetCategoryTreeHandler from "@src/application/category/use-cases/GetCategoryTreeHandler";
import CreateCategoryHandler from "@src/application/category/use-cases/CreateCategoryHandler";
import UpdateCategoryHandler from "@src/application/category/use-cases/UpdateCategoryHandler";
import DeleteCategoryHandler from "@src/application/category/use-cases/DeleteCategoryHandler";
import GetAllCategoriesHandler from "@src/application/category/use-cases/GetAllCategoriesHandler";
import GetCategoryByIdHandler from "@src/application/category/use-cases/GetCategoryByIdHandler";
import IEventRepository from "@src/domain/event/interfaces/IEventRepository";
import EventRepository from "@src/infrastructure/db/EventRepository";
import { IJwtService } from "@src/domain/user/interfaces/IJwtService";
import { JwtService } from "@src/infrastructure/security/JwtService";
import LoginUserHandler from "@src/application/user/use-cases/LoginUserHandler";
import GetAllEventsHandler from "@src/application/event/use-cases/GetAllEventsHandler";

const container = new Container();

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(new PrismaClient());
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository);
container.bind<IPasswordHasher>(TYPES.IPasswordHasher).to(Argon2PasswordHasher);
container.bind<ICategoryRepository>(TYPES.ICategoryRepository).to(CategoryRepository);
container.bind<IEventRepository>(TYPES.IEventRepository).to(EventRepository);

container.bind<RegisterUserHandler>(TYPES.RegisterUserHandler).to(RegisterUserHandler);

container.bind<CreateCategoryHandler>(TYPES.CreateCategoryHandler).to(CreateCategoryHandler);
container.bind<GetCategoryTreeHandler>(TYPES.GetCategoryTreeHandler).to(GetCategoryTreeHandler);
container.bind<UpdateCategoryHandler>(TYPES.UpdateCategoryHandler).to(UpdateCategoryHandler);
container.bind<DeleteCategoryHandler>(TYPES.DeleteCategoryHandler).to(DeleteCategoryHandler);
container.bind<GetAllCategoriesHandler>(TYPES.GetAllCategoriesHandler).to(GetAllCategoriesHandler);
container.bind<GetCategoryByIdHandler>(TYPES.GetCategoryByIdHandler).to(GetCategoryByIdHandler);
container.bind<IJwtService>(TYPES.IJwtService).to(JwtService);
container.bind<LoginUserHandler>(TYPES.LoginUserHandler).to(LoginUserHandler);
container.bind<GetAllEventsHandler>(TYPES.GetAllEventsHandler).to(GetAllEventsHandler);
export {
    container,
    TYPES
}