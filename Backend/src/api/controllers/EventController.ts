import "reflect-metadata";
import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, interfaces } from 'inversify-express-utils';
import { inject } from 'inversify';
import { TYPES } from '@config/types';
import ResponseEntity from '@api/shared/ResponseEntity';
import { StatusCodes } from 'http-status-codes';
import { ValidationMiddleware } from '@api/middleware/ValidationMiddleware';

import GetAllEventsRequestDto from '@api/dtos/event/GetAllEvents/GetAllEventsRequestDto';
import GetAllEventsResponseDto from '@api/dtos/event/GetAllEvents/GetAllEventsResponseDto';
import { GetAllEventsQuery } from '@application/event/quries/GetAllEventsQuery';
import  GetAllEventsHandler,{ PaginatedEventsHandlerResult } from '@application/event/use-cases/GetAllEventsHandler';
import { IsAuthorized } from "@api/middleware/isAuthorized.middleware";
import { isAuthenticated } from "@api/middleware/isAuthenticated.middleware";
import { IdentifyUserIfLogedin } from "@api/middleware/optionalAuth.middleware";
import { RoleType } from "@src/shared/RoleType";
import { IJwtPayload } from "@src/domain/user/interfaces/IJwtService";
@controller("/events")
export default class EventController implements interfaces.Controller {
    constructor(
        @inject(TYPES.GetAllEventsHandler) private readonly getAllEventsHandler: GetAllEventsHandler
    ) {}

    /**
     * @openapi
     * /events:
     * get:
     * tags: [Events]
     * summary: Get a paginated list of events
     * description: Retrieves events with optional filtering by text, category IDs, or category names. Includes child categories.
     * parameters:
     * - in: query
     * name: page
     * schema: { type: integer, default: 1, minimum: 1 }
     * required: false
     * description: Page number for pagination.
     * - in: query
     * name: limit
     * schema: { type: integer, default: 10, minimum: 1, maximum: 100 }
     * required: false
     * description: Number of items per page.
     * - in: query
     * name: textSearch
     * schema: { type: string, minLength: 1 }
     * required: false
     * description: Text to search in event name and description.
     * - in: query
     * name: categoryIds
     * schema: { type: string } # Or type: array, items: { type: integer } if query parser supports
     * required: false
     * description: Comma-separated string of category IDs to filter by (includes children). Example "1,2,3".
     * - in: query
     * name: categoryNames
     * schema: { type: string } # Or type: array, items: { type: string }
     * required: false
     * description: Comma-separated string of category names to filter by (includes children). Example "Music,Sports".
     * responses:
     * '200':
     * description: Successfully retrieved events.
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/ResponseEntity_GetAllEventsResponseDto'
     * '400':
     * description: Invalid query parameters.
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/ResponseEntity_ValidationErrors'
     * '500':
     * description: Internal server error.
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/ResponseEntity_Error'
     */
    @httpGet("/", IdentifyUserIfLogedin ,ValidationMiddleware(GetAllEventsRequestDto, 'query'))
    public async getAllEvents(req: Request, res: Response, next: NextFunction) {
        // Using req.validatedQuery as populated by your ValidationMiddleware
        const queryDto = (req as any).validatedQuery as GetAllEventsRequestDto;

        console.log(queryDto); 
        console.log("ffffffffffff");
        
        const user = (req as any).user as IJwtPayload | undefined; 

        const query = new GetAllEventsQuery(
            queryDto.page || 1,
            queryDto.limit || 10,
            queryDto.textSearch,
            queryDto.categoryIds,    // These should be number[] if DTO @Transform works via validatedQuery
            queryDto.categoryNames,  // These should be string[] if DTO @Transform works via validatedQuery
            user?.userId,            // Passing optional userId
            user?.role as RoleType | undefined // Passing optional role, correctly typed
        );

        try {
            const paginatedResult: PaginatedEventsHandlerResult = await this.getAllEventsHandler.execute(query);
            const responseDtoInstance = GetAllEventsResponseDto.fromPaginatedResult(paginatedResult);

            const responseEntity = new ResponseEntity(
                StatusCodes.OK,
                "Events retrieved successfully.",
                responseDtoInstance
            );
            return res.status(responseEntity.getStatus()).json(responseEntity);
        } catch (error) {
            return next(error);
        }
    }
}