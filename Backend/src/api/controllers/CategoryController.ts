import { controller, httpPost, interfaces, request, response } from "inversify-express-utils";
import { Request, Response, NextFunction } from "express";
import { inject } from "inversify";
import { TYPES } from "@src/types";
import ResponseEntity from "@api/shared/ResponseEntity";
import { StatusCodes } from "http-status-codes";
import { ValidationMiddleware } from "@api/middleware/ValidationMiddleware";
import { mapToDto } from "@shared/utils/mapper.util";
import CreateCategoryRequestDto from "../dtos/CreateCategory/CreateCategoryRequestDto";
// import CreateCategoryResponseDto from "../dtos/CreateCategory/CreateCategoryResponseDto";
import RegisterUserCommand from "@application/category/commands/CreateCategoryCommand";
@controller("/category")
export default class CategoryController implements interfaces.Controller {
    constructor(
        @inject(TYPES.RegisterUserHandler) private registerUserUseCase: RegisterUserHandler
    ) { }

    @httpPost("/category", ValidationMiddleware(CreateCategoryRequestDto))
    async createCategory(@request() req: Request, @response() res: Response) {

            const command = new RegisterUserCommand(
                req.body.getName(),
                req.body.getParentId(),
            );

            const registeredUser = await this.registerUserUseCase.execute(command);

            const responseBody = mapToDto(RegisterUserResponseDto, registeredUser);

            const responseEntity = new ResponseEntity(StatusCodes.CREATED, "Registration successful", responseBody);

            return res.status(responseEntity.getStatus()).json(responseEntity);

        
    }
}
