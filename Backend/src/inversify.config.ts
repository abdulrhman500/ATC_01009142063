

import { Container } from "inversify"; // Import Container
import { IUserRepository } from "@domain/user/interfaces/IUserRepository"; // Import IUserRepository interface
import { UserRepository } from "./infrastructure/db/UserRepository"; // Import UserRepository implementation
import { RegisterUserHandler } from "@src/application/user/use-cases/RegisterUserHandler"; // Import RegisterUserUseCase
import { PrismaClient } from "@prisma/client";
import {Argon2PasswordHasher} from "@infrastructure/Argon2PasswordHasher";
import IPasswordHasher from "./domain/user/interfaces/IPasswordHasher";
import CategoryRepository from "@infrastructure/db/CategoryRepository";
import ICategoryRepository from "@domain/category/interfaces/ICategoryRepository";

import { TYPES } from "./types";

const container = new Container();

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(new PrismaClient());
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository);
container.bind<RegisterUserHandler>(TYPES.RegisterUserHandler).to(RegisterUserHandler);
container.bind<IPasswordHasher>(TYPES.IPasswordHasher).to(Argon2PasswordHasher);
container.bind<ICategoryRepository>(TYPES.ICategoryRepository).to(CategoryRepository);
export {
    container,
    TYPES
}