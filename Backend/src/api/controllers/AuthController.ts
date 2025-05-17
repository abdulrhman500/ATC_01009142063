import { controller, httpPost, interfaces, request, response } from "inversify-express-utils";
import { Request, Response, NextFunction } from "express";
import { inject } from "inversify";
import { TYPES } from "@src/config/types";
import { RegisterUserHandler } from "@application/user/use-cases/RegisterUserHandler";
import RegisterUserCommand from "@application/user/commands/RegisterUserCommand";
import RegisterUserRequestDto from "@src/api/dtos/auth/Register/RegisterUserRequestDto";
import ResponseEntity from "@api/shared/ResponseEntity";
import { StatusCodes } from "http-status-codes";
import { ValidationMiddleware } from "@api/middleware/ValidationMiddleware";
import RegisterUserResponseDto from "@src/api/dtos/auth/Register/RegisterUserResponseDto";
import { classToPlain } from "class-transformer";
import LoginUserHandler, { LoginResult } from "@src/application/user/use-cases/LoginUserHandler";
import { LoginUserCommand } from "@src/application/user/commands/LoginUserCommand";
import LoginRequestDto from "@api/dtos/auth/login/LoginRequestDto";
import LoginResponseDto from "@src/api/dtos/auth/login/LoginResponseDto";
@controller("/auth")
export default class AuthController implements interfaces.Controller {
    constructor(
        @inject(TYPES.RegisterUserHandler) private readonly registerUserHandler: RegisterUserHandler,
        @inject(TYPES.LoginUserHandler) private readonly loginUserHandler: LoginUserHandler
    ) { }

    /**
        * @openapi
        * /auth/register:
        * post:
        * tags: [Authentication]
        * summary: Register a new user
        * description: Creates a new user account.
        * requestBody:
        * required: true
        * content:
        * application/json:
        * schema:
        * $ref: '#/components/schemas/RegisterUserRequestDto'
        * responses:
        * '201':
        * description: User registered successfully.
        * content:
        * application/json:
        * schema:
        * $ref: '#/components/schemas/ResponseEntity_RegisterUserResponseDto' // Define this in your OpenAPI spec
        * '400':
        * description: Validation error or user already exists.
        * content:
        * application/json:
        * schema:
        * $ref: '#/components/schemas/ResponseEntity_Error' // Or ResponseEntity_ValidationErrors
        * '500':
        * description: Internal server error.
        * content:
        * application/json:
        * schema:
        * $ref: '#/components/schemas/ResponseEntity_Error'
        */
    @httpPost("/register", ValidationMiddleware(RegisterUserRequestDto, 'body'))
    public async register(
        @request() req: Request,
        @response() res: Response
    ) {

        const command = new RegisterUserCommand(
            req.body.firstName,
            req.body.middleName ?? " ",
            req.body.lastName,
            req.body.username,
            req.body.email,
            req.body.password
        );

        const createdUserEntity = await this.registerUserHandler.execute(command);
        const responseDto = RegisterUserResponseDto.fromEntity(createdUserEntity);
        const plainResponseBody = classToPlain(responseDto);

        const responseEntity = new ResponseEntity(
            StatusCodes.CREATED,
            "User registered successfully.",
            plainResponseBody);
            console.log(plainResponseBody);
            console.log("ffffffffffffffffffffffffffffffffffffffffffffffffffff");
            console.log(responseEntity);
            
            

        return res.status(responseEntity.getStatus()).json(responseEntity.toJSON());

    }

    /**
     * @openapi
     * /auth/login:
     * post:
     * tags: [Authentication]
     * summary: Log in a user
     * description: Authenticates a user with email/username and password, returns a JWT upon success.
     * requestBody:
     * required: true
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/LoginRequestDto'
     * responses:
     * '200':
     * description: Login successful, JWT returned.
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/ResponseEntity_LoginResponseDto'
     * '400':
     * description: Validation error for request payload.
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/ResponseEntity_ValidationErrors'
     * '401':
     * description: Invalid credentials.
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/ResponseEntity_Error'
     * '500':
     * description: Internal server error.
     */
    @httpPost("/login", ValidationMiddleware(LoginRequestDto, 'body'))
    public async login(
        @request() req: Request,
        @response() res: Response,
    ) {
        const dto = req.body;
        const identifier = dto.email || dto.username!; // One of them must be present due to DTO validation

        const command = new LoginUserCommand(identifier, dto.password);

        const loginResult: LoginResult = await this.loginUserHandler.execute(command);
        const responseDtoInstance = LoginResponseDto.toDtoFrom(loginResult);

        // Pass the DTO instance to ResponseEntity; it handles instanceToPlain in its toJSON()
        const responseEntity = new ResponseEntity(
            StatusCodes.OK,
            "Login successful.",
            responseDtoInstance
        );
        return res.status(responseEntity.getStatus()).json(responseEntity);

    }

}
