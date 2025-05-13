

import { Container } from "inversify"; // Import Container
import { IUserRepository } from "@domain/user/interfaces/IUserRepository"; // Import IUserRepository interface
import { UserRepository } from "@infrastructure/db/UserRepository"; // Import UserRepository implementation
import { RegisterUserUseCase } from "@application/user/use-cases/RegisterUserUseCase"; // Import RegisterUserUseCase
const TYPES = {
    IUserRepository: Symbol.for("IUserRepository"),
    RegisterUserUseCase: Symbol.for("RegisterUserUseCase"),
};

const container = new Container();

container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository);
container.bind<RegisterUserUseCase>(TYPES.RegisterUserUseCase).to(RegisterUserUseCase);

export {
    container,
    TYPES
}