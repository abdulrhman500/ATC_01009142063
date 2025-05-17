import "reflect-metadata";
import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost, interfaces } from 'inversify-express-utils';
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
import { CreateEventHandler } from "@src/application/event/use-cases/CreateEventHandler";
import EventSummaryResponseDto from "../dtos/event/GetAllEvents/EventSummaryResponseDto";
import { CreateEventCommand } from "@src/application/event/commands/CreateEventCommand";
import { BadRequestException } from "@src/shared/exceptions/http.exception";
import CreateEventRequestDto from "../dtos/event/CreateEvent/CreateEventRequestDto";
@controller("/events")
export default class EventController implements interfaces.Controller {
    constructor(
        @inject(TYPES.GetAllEventsHandler) private readonly getAllEventsHandler: GetAllEventsHandler,
        @inject(TYPES.CreateEventHandler) private readonly createEventHandler: CreateEventHandler // Inject new handler
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
    // --- NEW: Create Event Endpoint ---
    /**
     * @openapi
     * /events:
     * post:
     * tags: [Events]
     * summary: Create a new event
     * description: Creates a new event. Requires ADMIN role.
     * security:
     * - bearerAuth: [] # Indicates JWT Bearer token is expected for authentication
     * requestBody:
     * required: true
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/CreateEventRequestDto'
     * responses:
     * '201':
     * description: Event created successfully.
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/ResponseEntity_EventSummaryResponseDto' # Or CreateEventResponseDto if different
     * '400':
     * description: Validation error, invalid input (e.g., non-existent categoryId/venueId), or invalid date.
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/ResponseEntity_ValidationErrors'
     * '401':
     * description: Unauthorized - Authentication token is missing or invalid.
     * '403':
     * description: Forbidden - User does not have ADMIN permission.
     * '500':
     * description: Internal server error.
     */
    @httpPost(
        "/",
        isAuthenticated, // 1. User must be authenticated
        IsAuthorized([RoleType.ADMIN]), // 2. User must be an ADMIN
        ValidationMiddleware(CreateEventRequestDto, 'body') // 3. Validate request body
    )
    public async createEvent(req: Request, res: Response, next: NextFunction) {
        const dto = req.body as CreateEventRequestDto; // Populated by ValidationMiddleware
        const user = (req as any).user; // Populated by isAuthenticated

        // Convert date string from DTO to Date object for the command
        const eventDate = new Date(dto.date);
        if (isNaN(eventDate.getTime())) {
            // Pass error to global error handler
            return next(new BadRequestException("Invalid event date format. Please use ISO 8601 format."));
        }

        // CreateEventCommand does not take creatorId as per your last instruction
        const command = new CreateEventCommand(
            dto.name,
            dto.description,
            eventDate, // Pass the Date object
            dto.venueId,
            dto.priceValue,
            dto.priceCurrency,
            dto.photoUrl ? dto.photoUrl.toString() : undefined,
            dto.categoryId
        );

            // Assuming CreateEventHandler now returns { event: Event, category?: Category }
            const { event: createdEventEntity, category: associatedCategory } =
                await this.createEventHandler.execute(command);

            const responseDtoInstance = EventSummaryResponseDto.toDtoFrom(createdEventEntity, false, associatedCategory);

            const responseEntity = new ResponseEntity(
                StatusCodes.CREATED,
                "Event created successfully.",
                responseDtoInstance 
            );
            return res.status(responseEntity.getStatus()).json(responseEntity);
        
    }
}