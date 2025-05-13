import { controller, httpPost, interfaces, request, response } from "inversify-express-utils";
import { Request, Response, NextFunction } from "express";
import { inject } from "inversify";
import { TYPES } from "@src/inversify.config";
import { RegisterUserHandler } from "@application/user/use-cases/RegisterUserUseCase";
import { RegisterUserCommand } from "@application/user/commands/RegisterUserCommand";
import { RegisterUserDtoRequest } from "@api/dtos/RegisterUserRequestDto";
import ResponseEntity from "@api/shared/ResponseEntity";
import InternalServerErrorResponseEntity from "@api/shared/InternalServerErrorResponseEntity";
import BadRequestResponseEntity from "@api/shared/BadRequestResponseEntity";
import { StatusCodes } from "http-status-codes";
import UserAlreadyExistException from "@domain/user/exceptions/UserAlreadyExistException";
import {ValidationMiddleware} from "@api/middleware/ValidationMiddleware";


@controller("/auth")
export default class AuthController implements interfaces.Controller {
    constructor(
        @inject(TYPES.RegisterUserUseCase) private registerUserUseCase: RegisterUserHandler
    ) {}

    @httpPost("/register", ValidationMiddleware(RegisterUserDtoRequest))
    async register(@request() req: Request, @response() res: Response) {

        try {
            const command = new RegisterUserCommand(
                req.body.firstName,
                req.body.middleName,
                req.body.lastName,
                req.body.email,
                req.body.username,
                req.body.password
            );

            const registeredUser = await this.registerUserUseCase.execute(command);

            // const responseEntity = new ResponseEntity(StatusCodes.CREATED, "Registration successful", {
            //     id: registeredUser.id.getValue(),
            //     username: registeredUser.username.getValue(),
            //     email: registeredUser.email.getValue(),
            //     name: registeredUser.name.getValue(),
            //     createdAt: registeredUser.createdAt
            // });

            // return res.status(responseEntity.getStatus()).json(responseEntity);

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
