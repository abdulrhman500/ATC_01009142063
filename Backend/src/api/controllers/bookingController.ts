import "reflect-metadata";
import { Request, Response, NextFunction } from 'express';
import { controller, httpPost, interfaces } from 'inversify-express-utils';
import { inject } from 'inversify';
import { TYPES } from '@config/types';
import ResponseEntity from '@api/shared/ResponseEntity';
import { StatusCodes } from 'http-status-codes';
import { IsAuthorized } from "../middleware/isAuthorized.middleware";
import { isAuthenticated } from "../middleware/isAuthenticated.middleware";
import { RoleType } from "@src/shared/RoleType";
import { ValidationMiddleware } from "../middleware/ValidationMiddleware";
import CreateBookingRequestDto from "../dtos/booking/CreateBookingRequestDto";
import CreateBookingCommand from "@src/application/booking/commands/CreateBookingCommand";
import CreateBookingHandler  from "@src/application/booking/use-cases/CreateBookingHandler";

@controller("/booking")
export default class BookingController implements interfaces.Controller {
    CreateBookingHandler: any;
    constructor(
        @inject(TYPES.CreateBookingHandler) private readonly createBookingHandler: CreateBookingHandler
    ) { }


  
    @httpPost(
        "/",
        isAuthenticated,
        IsAuthorized([RoleType.CUSTOMER]),
        ValidationMiddleware(CreateBookingRequestDto, 'body')
    )
    public async createBooking(req: Request, res: Response, next: NextFunction) {
        const dto = req.body as CreateBookingRequestDto;

        const command = new CreateBookingCommand(
            dto.eventId as any,
            (req as any).user.userId as any,
        );

        try {
            const createdBookingVO = await this.CreateBookingHandler.execute(command);

            const responseEntity = new ResponseEntity(
                StatusCodes.CREATED,
                "Booking created successfully.",
                createdBookingVO
            );
            return res.status(responseEntity.getStatus()).json(responseEntity);
        } catch (error) {
            return next(error);
        }
    }
}