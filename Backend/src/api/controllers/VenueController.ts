import "reflect-metadata";
import { Request, Response, NextFunction } from 'express';
import { controller, httpGet, httpPost, interfaces } from 'inversify-express-utils';
import { inject } from 'inversify';
import { TYPES } from '@config/types';
import ResponseEntity from '@api/shared/ResponseEntity';
import { StatusCodes } from 'http-status-codes';
import { GetAllVenuesHandler } from '@application/venue/use-cases/GetAllVenuesHandler';
import GetAllVenuesResponseDto from '@api/dtos/venue/getAllVenues/GetAllVenuesResponseDto';
import VenueVO from "@domain/event/value-objects/Venue";
import { IsAuthorized } from "../middleware/isAuthorized.middleware";
import { isAuthenticated } from "../middleware/isAuthenticated.middleware";
import { RoleType } from "@src/shared/RoleType";
import { ValidationMiddleware } from "../middleware/ValidationMiddleware";
import CreateVenueRequestDto from "../dtos/venue/CreateVenue/CreateVenueRequestDto";
import { CreateVenueCommand } from "@src/application/venue/commands/CreateVenueCommand";
import { CreateVenueHandler } from "@src/application/venue/use-cases/CreateVenueHandler";
import VenueResponseDto from "../dtos/venue/getAllVenues/VenueResponseDto";
/**
 * @openapi
 * tags:
 * name: Venues
 * description: Venue management operations
 */
@controller("/venues")
export default class VenueController implements interfaces.Controller {
    constructor(
        @inject(TYPES.GetAllVenuesHandler) private readonly getAllVenuesHandler: GetAllVenuesHandler,
        @inject(TYPES.CreateVenueHandler) private readonly createVenueHandler: CreateVenueHandler
    ) {}

    /**
     * @openapi
     * /venues:
     * get:
     * tags: [Venues]
     * summary: Get a list of all available venues
     * description: Retrieves a list of all venues. Publicly accessible.
     * responses:
     * '200':
     * description: Successfully retrieved venues.
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/ResponseEntity_GetAllVenuesResponseDto'
     * '500':
     * description: Internal server error.
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/ResponseEntity_Error'
     */
    @httpGet("/", isAuthenticated, IsAuthorized([RoleType.ADMIN]))
    public async getAllVenues(req: Request, res: Response, next: NextFunction) {
       
        const venueVOs: VenueVO[] = await this.getAllVenuesHandler.execute();
            const responseDtoInstance = GetAllVenuesResponseDto.toDtoFrom(venueVOs);

            const responseEntity = new ResponseEntity(
                StatusCodes.OK,
                "Venues retrieved successfully.",
                responseDtoInstance // Pass DTO instance directly
            );
            return res.status(responseEntity.getStatus()).json(responseEntity);
        
    }

     /**
     * @openapi
     * /venues:
     * post:
     * tags: [Venues]
     * summary: Create a new venue
     * description: Creates a new venue. Requires ADMIN role.
     * security:
     * - bearerAuth: []
     * requestBody:
     * required: true
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/CreateVenueRequestDto'
     * responses:
     * '201':
     * description: Venue created successfully.
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/ResponseEntity_VenueResponseDto'
     * '400':
     * description: Validation error or invalid input.
     * '401':
     * description: Unauthorized.
     * '403':
     * description: Forbidden.
     * '500':
     * description: Internal server error.
     */
     @httpPost(
        "/",
        isAuthenticated,
        IsAuthorized([RoleType.ADMIN]), // ADMIN only to create venues
        ValidationMiddleware(CreateVenueRequestDto, 'body')
    )
    public async createVenue(req: Request, res: Response, next: NextFunction) {
        const dto = req.body as CreateVenueRequestDto; // Assuming ValidationMiddleware replaces req.body

        const command = new CreateVenueCommand(
            dto.name,
            dto.street,
            dto.city,
            dto.country,
            dto.state,
            dto.postalCode,
            dto.placeUrl
        );

        try {
            const createdVenueVO = await this.createVenueHandler.execute(command);
            const responseDtoInstance = VenueResponseDto.toDtoFrom(createdVenueVO);

            const responseEntity = new ResponseEntity(
                StatusCodes.CREATED,
                "Venue created successfully.",
                responseDtoInstance
            );
            return res.status(responseEntity.getStatus()).json(responseEntity);
        } catch (error) {
            return next(error);
        }
    }
}