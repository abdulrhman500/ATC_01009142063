

import { Container } from "inversify"; // Import Container
import { IUserRepository } from "@domain/user/interfaces/IUserRepository"; // Import IUserRepository interface
import { UserRepository } from "@infrastructure/db/UserRepository"; // Import UserRepository implementation
import { RegisterUserHandler } from "@application/user/use-cases/RegisterUserUseCase"; // Import RegisterUserUseCase
import { PrismaClient } from "@prisma/client";
const TYPES = {
    IUserRepository: Symbol.for("IUserRepository"),
    RegisterUserUseCase: Symbol.for("RegisterUserUseCase"),
    PrismaClient: Symbol.for("PrismaClient"),
};

const container = new Container();
container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(new PrismaClient());

container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository);
container.bind<RegisterUserHandler>(TYPES.RegisterUserUseCase).to(RegisterUserHandler);

export {
    container,
    TYPES
}