import { controller, httpPost, interfaces, request, response } from "inversify-express-utils";
import { Request, Response, NextFunction } from "express";
import { inject } from "inversify";
import { TYPES } from "@src/config/types";
import { RegisterUserHandler } from "@application/user/use-cases/RegisterUserHandler";
import { RegisterUserCommand } from "@application/user/commands/RegisterUserCommand";
import { RegisterUserDtoRequest } from "@src/api/dtos/RegisterUser/RegisterUserRequestDto";
import ResponseEntity from "@api/shared/ResponseEntity";
import { StatusCodes } from "http-status-codes";
import UserAlreadyExistException from "@domain/user/exceptions/UserAlreadyExistException";
import { ValidationMiddleware } from "@api/middleware/ValidationMiddleware";
import { mapToDto } from "@shared/utils/mapper.util";
import { RegisterUserResponseDto } from "@src/api/dtos/RegisterUser/RegisterUserResponseDto";
@controller("/auth")
export default class AuthController implements interfaces.Controller {
    constructor(
        @inject(TYPES.RegisterUserHandler) private registerUserUseCase: RegisterUserHandler
    ) { }

    @httpPost("/register", ValidationMiddleware(RegisterUserDtoRequest))
    async register(@request() req: Request, @response() res: Response) {

            const command = new RegisterUserCommand(
                req.body.firstName,
                req.body.middleName,
                req.body.lastName,
                req.body.email,
                req.body.username,
                req.body.password
            );

            const registeredUser = await this.registerUserUseCase.execute(command);

            const responseBody = mapToDto(RegisterUserResponseDto, registeredUser);

            const responseEntity = new ResponseEntity(StatusCodes.CREATED, "Registration successful", responseBody);

            return res.status(responseEntity.getStatus()).json(responseEntity);

        
    }
}
