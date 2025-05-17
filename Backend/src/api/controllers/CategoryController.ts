import { controller, httpDelete, httpGet, httpPatch, httpPost, interfaces, request, response } from "inversify-express-utils";
import express from "express";
import { inject } from "inversify";
import { TYPES } from "@src/config/types"; // Corrected path from user
import ResponseEntity from "@api/shared/ResponseEntity";
import { StatusCodes } from "http-status-codes";
import { ValidationMiddleware } from "@api/middleware/ValidationMiddleware";
import { classToPlain } from 'class-transformer';

// Commands, Queries, Handlers
import CreateCategoryCommand from "@application/category/commands/CreateCategoryCommand";
import CreateCategoryHandler from "@application/category/use-cases/CreateCategoryHandler";
import GetCategoryTreeHandler from "@application/category/use-cases/GetCategoryTreeHandler";
import UpdateCategoryCommand from "@application/category/commands/UpdateCategoryCommand";
import UpdateCategoryHandler from "@application/category/use-cases/UpdateCategoryHandler";
import DeleteCategoryCommand from "@application/category/commands/DeleteCategoryCommand";
import DeleteCategoryHandler from "@application/category/use-cases/DeleteCategoryHandler";
import GetAllCategoriesQuery from "@src/application/category/queries/GetAllCategoriesQuery";
import GetAllCategoriesHandler from "@application/category/use-cases/GetAllCategoriesHandler";
import GetCategoryByIdQuery from "@src/application/category/queries/GetCategoryByIdQuery";
import GetCategoryByIdHandler from "@src/application/category/use-cases/GetCategoryByIdHandler";

// DTOs
import CreateCategoryRequestDto from "@api/dtos/category/CreateCategory/CreateCategoryRequestDto";
import CreateCategoryResponseDto from "@api/dtos/category/CreateCategory/CreateCategoryResponseDto"; // Used by ResponseEntity_CreateCategoryResponseDto
import GetCategoryTreeResponseDto from "@api/dtos/category/GetCategoryTree/GetCategoryTreeResponseDto"; // Used by ResponseEntity_GetCategoryTreeResponseDto
import UpdateCategoryRequestDto from "@api/dtos/category/UpdateCategory/UpdateCategoryRequestDto";
import UpdateCategoryResponseDto from "@api/dtos/category/UpdateCategory/UpdateCategoryResponseDto"; // Used by ResponseEntity_UpdateCategoryResponseDto
import GetAllCategoriesRequestDto from "@api/dtos/category/GetAllCategory/GetAllCategoriesRequestDto";
import GetAllCategoriesResponseDto from "@api/dtos/category/GetAllCategory/GetAllCategoriesResponseDto"; // CategorySummary used by GetAllCategoriesResponseDto, which is used by ResponseEntity_GetAllCategoriesResponseDto
import GetCategoryByIdRequestParamsDto from "@api/dtos/category/GetCategoryById/GetCategoryByIdRequestParamsDto";
import GetCategoryByIdResponseDto from "@api/dtos/category/GetCategoryById/GetCategoryByIdResponseDto"; // Used by ResponseEntity_GetCategoryByIdResponseDto
import CategorySummaryResponseDto from "@api/dtos/category/CategorySummaryResponseDto";
// Domain & Shared
import Category from "@src/domain/category/Category";
import { PaginatedCategoriesResult } from "@src/domain/category/interfaces/ICategoryRepository";
// BadRequestException is now imported from http.exception which is good
import { BadRequestException, NotFoundException } from "@src/shared/exceptions/http.exception";


/**
 * @openapi
 * tags:
 * name: Category
 * description: Category management operations
 */
@controller("/category")
export default class CategoryController implements interfaces.Controller {
    constructor(
        @inject(TYPES.CreateCategoryHandler) private readonly createCategoryHandler: CreateCategoryHandler,
        @inject(TYPES.GetCategoryTreeHandler) private readonly getCategoryTreeHandler: GetCategoryTreeHandler,
        @inject(TYPES.UpdateCategoryHandler) private readonly updateCategoryHandler: UpdateCategoryHandler,
        @inject(TYPES.DeleteCategoryHandler) private readonly deleteCategoryHandler: DeleteCategoryHandler,
        @inject(TYPES.GetAllCategoriesHandler) private readonly getAllCategoriesHandler: GetAllCategoriesHandler,
        @inject(TYPES.GetCategoryByIdHandler) private readonly getCategoryByIdHandler: GetCategoryByIdHandler
    ) { }

    /**
     * @openapi
     * /category:
     *   post:
     *     tags: [Category]
     *     summary: Create a new category
     *     description: Creates a new category with a name and an optional parent ID.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateCategoryRequestDto'
     *     responses:
     *       '201':
     *         description: Category created successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResponseEntity_CreateCategoryResponseDto'
     *       '400':
     *         description: Validation failed or invalid input.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResponseEntity_ValidationErrors'
     *       '500':
     *         description: Internal server error.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResponseEntity_Error'
     */
    @httpPost("/", ValidationMiddleware(CreateCategoryRequestDto, 'body'))
    async createCategory(@request() req: express.Request, @response() res: express.Response) {
        const command = new CreateCategoryCommand(
            req.body.name,
            req.body.parentId
        );
        const createdCategory = await this.createCategoryHandler.execute(command);
        const responseBody = CreateCategoryResponseDto.toDtoFrom(createdCategory);
        const plainResponseBodyForCreate = classToPlain(responseBody);

        const responseEntity = new ResponseEntity(
            StatusCodes.CREATED,
            "Category created successfully",
            plainResponseBodyForCreate
        );

        
        
        return res.status(responseEntity.getStatus()).json(responseEntity);
    }

    /**
     * @openapi
     * /category/tree:
     *   get:
     *     tags: [Category]
     *     summary: Get all categories as a hierarchical tree
     *     description: Retrieves all categories structured as a tree, where each category includes its children.
     *     responses:
     *       '200':
     *         description: Category tree retrieved successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResponseEntity_GetCategoryTreeResponseDto'
     *       '500':
     *         description: Internal server error.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResponseEntity_Error'
     */
    @httpGet("/tree")
    async getCategoryTree(@request() req: express.Request, @response() res: express.Response) {
        const rootDomainCategories: Category[] = await this.getCategoryTreeHandler.execute();

        // Use the DTO's static method to map from the domain tree roots
        const responseBodyDto = GetCategoryTreeResponseDto.toDtoFrom(rootDomainCategories);
    
        const plainResponseBody = classToPlain(responseBodyDto);
        const responseEntity = new ResponseEntity(
            StatusCodes.OK,
            "Category tree retrieved successfully",
            plainResponseBody
        );
        return res.status(responseEntity.getStatus()).json(responseEntity);
    }

    /**
     * @openapi
     * /category/{id}:
     * patch:
     * tags: [Category]
     * summary: Update an existing category
     * description: Partially updates an existing category's name and/or parent ID.
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: Numeric ID of the category to update.
     *         schema:
     *           type: integer
     *           format: int64
     *           example: 1
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateCategoryRequestDto'
     *     responses:
     *       '200':
     *         description: Category updated successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResponseEntity_UpdateCategoryResponseDto'
     *       '400':
     *         description: Validation failed, invalid ID format, or invalid operation (e.g., setting category as its own parent).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResponseEntity_ValidationErrors'
     *       '404':
     *         description: Category not found.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResponseEntity_Error'
     *       '500':
     *         description: Internal server error.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResponseEntity_Error'
     */
    @httpPatch("/:id", ValidationMiddleware(GetCategoryByIdRequestParamsDto, 'params'), ValidationMiddleware(UpdateCategoryRequestDto, 'body'))
    async updateCategory(
        @request() req: express.Request,
        @response() res: express.Response
    ) {
        const paramsDto = (req as any).validatedParams as GetCategoryByIdRequestParamsDto;
        const bodyDto = req.body as UpdateCategoryRequestDto;

        const command = new UpdateCategoryCommand(
            paramsDto.id,
            bodyDto.name,
            bodyDto.parentCategoryId
        );

        const updatedCategoryDomain = await this.updateCategoryHandler.execute(command);

        
        
        const responseBody = UpdateCategoryResponseDto.toDtoFrom(updatedCategoryDomain);
        
        const plainResponseBody = classToPlain(responseBody);

        
        const responseEntity = new ResponseEntity(
            StatusCodes.OK,
            "Category updated successfully",
            plainResponseBody
        );
        
        
        return res.status(responseEntity.getStatus()).json(responseEntity);
    }

    /**
     * @openapi
     * /category/{id}:
     * delete:
     * tags: [Category]
     * summary: Delete a category
     * description: >
     * Deletes a specific category.
     * Events and child categories linked to the deleted category will be reassigned to a "General" category.
     * The "General" category itself cannot be deleted.
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: Numeric ID of the category to delete.
     *         schema:
     *           type: integer
     *           format: int64
     *           example: 1
     *     responses:
     *       '204':
     *         description: Category deleted successfully. No content.
     *       '400':
     *         description: Invalid ID format or attempt to delete a protected category (e.g., "General").
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResponseEntity_Error'
     *       '404':
     *         description: Category not found.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResponseEntity_Error'
     *       '500':
     *         description: Internal server error or critical setup error (e.g., "General" category missing).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResponseEntity_Error'
     */
    @httpDelete("/:id", ValidationMiddleware(GetCategoryByIdRequestParamsDto, 'params'))
    async deleteCategory(
        @request() req: express.Request,
        @response() res: express.Response
    ) {
        const paramsDto = (req as any).validatedParams as GetCategoryByIdRequestParamsDto;
        const command = new DeleteCategoryCommand(paramsDto.id);

        await this.deleteCategoryHandler.execute(command);
        return res.status(StatusCodes.NO_CONTENT).send();
    }

    /**
     * @openapi
     * /category:
     * get:
     * tags: [Category]
     * summary: Get a paginated list of all categories (flat list)
     * description: Retrieves a flat list of all categories with pagination support.
     * parameters:
     * - name: page
     * in: query
     * required: false
     * description: Page number for pagination.
     * schema:
     * type: integer
     * default: 1
     * minimum: 1
     * - name: limit
     * in: query
     * required: false
     * description: Number of items per page.
     * schema:
     * type: integer
     * default: 10
     * minimum: 1
     * maximum: 100
     * responses:
     * '200':
     * description: Categories retrieved successfully.
     * content:
     * application/json:
     * schema:
     * $ref: '#/components/schemas/ResponseEntity_GetAllCategoriesResponseDto'
     * '400':
     * description: Invalid pagination parameters.
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
    @httpGet("/", ValidationMiddleware(GetAllCategoriesRequestDto, 'query'))
    async getAllCategories(@request() req: express.Request, @response() res: express.Response) {
        const queryParamsDto = (req as any).validatedQuery as GetAllCategoriesRequestDto;
        const query = new GetAllCategoriesQuery(
            queryParamsDto.page!,
            queryParamsDto.limit!
        );
        
        

        const paginatedDomainResult: PaginatedCategoriesResult = await this.getAllCategoriesHandler.execute(query);

        const responseData = GetAllCategoriesResponseDto.toDtoFrom(paginatedDomainResult);
        const plainResponseBody = classToPlain(responseData);
        const responseEntity = new ResponseEntity(
            StatusCodes.OK,
            "Categories retrieved successfully",
            plainResponseBody
        );
        return res.status(responseEntity.getStatus()).json(responseEntity);
    }

    /**
      * @openapi
      * /category/{id}:
      * get:
      * tags: [Category]
      * summary: Get a category by ID
      * description: Retrieves a category and its details by its unique ID.
      * parameters:
      *   - in: path
      *     name: id
      *     required: true
      *     schema:
      *       type: integer
      *       format: int64
      *       example: 1
      * responses:
      *   '200':
      *     description: Category retrieved successfully.
      *     content:
      *       application/json:
      *         schema:
      *           $ref: '#/components/schemas/ResponseEntity_GetCategoryByIdResponseDto'
      *   '400':
      *     description: Invalid ID format.
      *     content:
      *       application/json:
      *         schema:
      *           $ref: '#/components/schemas/ResponseEntity_ValidationErrors'
      *   '404':
      *     description: Category not found.
      *     content:
      *       application/json:
      *         schema:
      *           $ref: '#/components/schemas/ResponseEntity_Error'
      *   '500':
      *     description: Internal server error.
      *     content:
      *       application/json:
      *         schema:
      *           $ref: '#/components/schemas/ResponseEntity_Error'
      */
    @httpGet("/:id", ValidationMiddleware(GetCategoryByIdRequestParamsDto, 'params'))
    async getCategoryById(
        @request() req: express.Request,
        @response() res: express.Response
    ) {
        const paramsDto = (req as any).validatedParams as GetCategoryByIdRequestParamsDto;
        const query = new GetCategoryByIdQuery(paramsDto.id);
        const categoryDomain: Category = await this.getCategoryByIdHandler.execute(query);
        const responseBodyDto = GetCategoryByIdResponseDto.toDtoFrom(categoryDomain);
        const plainResponseBody = classToPlain(responseBodyDto);
        const responseEntity = new ResponseEntity(
            StatusCodes.OK,
            "Category retrieved successfully",
            plainResponseBody
        );
        // console.log("33333333333323232323");
        // console.log(responseEntity);
        
        
        return res.status(responseEntity.getStatus()).json(responseEntity);
    }
}