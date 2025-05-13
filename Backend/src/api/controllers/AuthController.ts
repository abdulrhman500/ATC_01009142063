import { controller, httpPost, interfaces, request, response } from "inversify-express-utils";
import { Request, Response, NextFunction } from "express";
import { inject } from "inversify";
import { TYPES } from "@src/inversify.config";
import { RegisterUserUseCase } from "@application/user/use-cases/RegisterUserUseCase";
import { RegisterUserCommand } from "@application/user/commands/RegisterUserCommand";
import { RegisterUserDtoRequest } from "@api/dtos/RegisterUserRequestDto";
import ResponseEntity from "@api/shared/ResponseEntity";
import InternalServerErrorResponseEntity from "@api/shared/InternalServerErrorResponseEntity";
import BadRequestResponseEntity from "@api/shared/BadRequestResponseEntity";
import { StatusCodes } from "http-status-codes";
import UserAlreadyExistException from "@domain/user/exceptions/UserAlreadyExistException";

function validateRegisterMiddleware(req: Request, res: Response, next: NextFunction) {
    const { email, firstName, lastName, middleName } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json(new BadRequestResponseEntity("Invalid email format"));
    }

    if (!firstName || !lastName) {
        return res.status(400).json(new BadRequestResponseEntity("First name and last name are required"));
    }

    // Ensure middleName is defined
    req.body.middleName = middleName || "";

    next();
}

@controller("/auth")
export default class AuthController implements interfaces.Controller {
    constructor(
        @inject(TYPES.RegisterUserUseCase) private registerUserUseCase: RegisterUserUseCase
    ) {}

    @httpPost("/register", validateRegisterMiddleware)
    async register(@request() req: Request, @response() res: Response) {
        const registerUserDto: RegisterUserDtoRequest = req.body;

        try {
            const command = new RegisterUserCommand(
                registerUserDto.firstName,
                registerUserDto.middleName,
                registerUserDto.lastName,
                registerUserDto.email,
                registerUserDto.username,
                registerUserDto.password
            );

            const registeredUser = await this.registerUserUseCase.execute(command);

            const responseEntity = new ResponseEntity(StatusCodes.CREATED, "Registration successful", {
                id: registeredUser.id.getValue(),
                username: registeredUser.username.getValue(),
                email: registeredUser.email.getValue(),
                name: registeredUser.name.getValue(),
                createdAt: registeredUser.createdAt
            });

            return res.status(responseEntity.getStatus()).json(responseEntity);

        } catch (error) {
            if (error instanceof UserAlreadyExistException) {
                const responseEntity = new ResponseEntity(StatusCodes.CONFLICT, error.message, {});
                return res.status(responseEntity.getStatus()).json(responseEntity);
            }

            const responseEntity = new InternalServerErrorResponseEntity(error);
            return res.status(responseEntity.getStatus()).json(responseEntity);
        }
    }
}
