import { controller, httpDelete, httpGet, httpPatch, httpPost, interfaces, request, response } from "inversify-express-utils";
import { Request, Response } from "express";
import { inject } from "inversify";
import { TYPES } from "@src/types";
import ResponseEntity from "@api/shared/ResponseEntity";
import { StatusCodes } from "http-status-codes";
import { ValidationMiddleware } from "@api/middleware/ValidationMiddleware";
import { mapToDto } from "@shared/utils/mapper.util";
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
import GetAllCategoriesHandler from "@application/category/use-cases/GetAllCategoriesHandler"; // Use PascalCase for class import
import GetCategoryByIdQuery from "@src/application/category/queries/GetCategoryByIdQuery";
import GetCategoryByIdHandler from "@src/application/category/use-cases/GetCategoryByIdHandler";

// DTOs
import CreateCategoryRequestDto from "@api/dtos/category/CreateCategory/CreateCategoryRequestDto"; // Assuming @api alias
import CreateCategoryResponseDto from "@api/dtos/category/CreateCategory/CreateCategoryResponseDto";
import GetCategoryTreeResponseDto from "@api/dtos/category/GetCategoryTree/GetCategoryTreeResponseDto";
import UpdateCategoryRequestDto from "@api/dtos/category/UpdateCategory/UpdateCategoryRequestDto";
import UpdateCategoryResponseDto from "@api/dtos/category/UpdateCategory/UpdateCategoryResponseDto";
import GetAllCategoriesRequestDto from "@api/dtos/category/GetAllCategory/GetAllCategoriesRequestDto";
import GetAllCategoriesResponseDto from "@api/dtos/category/GetAllCategory/GetAllCategoriesResponseDto"; // Assuming CategorySummaryResponseDto is also exported here or from its own file
import GetCategoryByIdRequestParamsDto from "@api/dtos/category/GetCategoryById/GetCategoryByIdRequestParamsDto";
import GetCategoryByIdResponseDto from "@api/dtos/category/GetCategoryById/GetCategoryByIdResponseDto";
import CategorySummaryResponseDto from "@api/dtos/category/CategorySummaryResponseDto"; 
import Category from "@src/domain/category/Category";
import { PaginatedCategoriesResult } from "@src/domain/category/interfaces/ICategoryRepository";
import { BadRequestException } from "@src/shared/exceptions/http.exception";


@controller("/category")
export default class CategoryController implements interfaces.Controller {
    constructor(
        @inject(TYPES.CreateCategoryHandler) private readonly createCategoryHandler: CreateCategoryHandler,
        @inject(TYPES.GetCategoryTreeHandler) private readonly getCategoryTreeHandler: GetCategoryTreeHandler,
        @inject(TYPES.UpdateCategoryHandler) private readonly updateCategoryHandler: UpdateCategoryHandler,
        @inject(TYPES.DeleteCategoryHandler) private readonly deleteCategoryHandler: DeleteCategoryHandler,
        @inject(TYPES.GetAllCategoriesHandler) private readonly getAllCategoriesHandler: GetAllCategoriesHandler,
        @inject(TYPES.GetCategoryByIdHandler) private readonly getCategoryByIdHandler: GetCategoryByIdHandler
    ) {
    }

    @httpPost("/", ValidationMiddleware(CreateCategoryRequestDto, 'body'))
    async createCategory(@request() req: Request, @response() res: Response) {
        const command = new CreateCategoryCommand(
            req.body.name,
            req.body.parentId
        );
        const createdCategory = await this.createCategoryHandler.execute(command);
        const responseBody = mapToDto(CreateCategoryResponseDto, createdCategory);
        const plainResponseBodyForCreate = classToPlain(responseBody);

        const responseEntity = new ResponseEntity(
            StatusCodes.CREATED,
            "Category created successfully",
            plainResponseBodyForCreate
        );
        return res.status(responseEntity.getStatus()).json(responseEntity);
    }

    @httpGet("/tree")
    async getCategoryTree(@request() req: Request, @response() res: Response) {
        const categoryTreeData: GetCategoryTreeResponseDto = await this.getCategoryTreeHandler.execute();
        const plainResponseBody = classToPlain(categoryTreeData);
        const responseEntity = new ResponseEntity(
            StatusCodes.OK,
            "Category tree retrieved successfully",
            plainResponseBody
        );
        return res.status(responseEntity.getStatus()).json(responseEntity);
    }

    // Using GetCategoryByIdRequestParamsDto for ID validation from path for consistency
    @httpPatch("/:id", ValidationMiddleware(GetCategoryByIdRequestParamsDto, 'params'), ValidationMiddleware(UpdateCategoryRequestDto, 'body'))
    async updateCategory(
        @request() req: Request, // Contains req.validatedParams and req.body
        @response() res: Response
    ) {
        const paramsDto = (req as any).validatedParams as GetCategoryByIdRequestParamsDto;
        const bodyDto = req.body as UpdateCategoryRequestDto;

        const command = new UpdateCategoryCommand(
            paramsDto.id, // Validated ID from path
            bodyDto.name,
            bodyDto.parentId
        );

        const updatedCategoryDomain = await this.updateCategoryHandler.execute(command);
        const responseBody = mapToDto(UpdateCategoryResponseDto, updatedCategoryDomain);
        const plainResponseBody = classToPlain(responseBody);
        const responseEntity = new ResponseEntity(
            StatusCodes.OK,
            "Category updated successfully",
            plainResponseBody
        );
        return res.status(responseEntity.getStatus()).json(responseEntity);
    }

    // Using GetCategoryByIdRequestParamsDto for ID validation from path for consistency
    @httpDelete("/:id", ValidationMiddleware(GetCategoryByIdRequestParamsDto, 'params'))
    async deleteCategory(
        @request() req: Request, // Contains req.validatedParams
        @response() res: Response
    ) {
        const paramsDto = (req as any).validatedParams as GetCategoryByIdRequestParamsDto;
        const command = new DeleteCategoryCommand(paramsDto.id); // Validated ID from path

        await this.deleteCategoryHandler.execute(command);
        return res.status(StatusCodes.NO_CONTENT).send();
    }

    @httpGet("/", ValidationMiddleware(GetAllCategoriesRequestDto, 'query'))
    async getAllCategories(@request() req: Request, @response() res: Response) {
        const queryParamsDto = (req as any).validatedQuery as GetAllCategoriesRequestDto;
        const query = new GetAllCategoriesQuery(
            queryParamsDto.page!,  // Should be number due to DTO default and @Type
            queryParamsDto.limit!  // Should be number due to DTO default and @Type
        );

        const paginatedDomainResult: PaginatedCategoriesResult = await this.getAllCategoriesHandler.execute(query);
        const categorySummaryDtos: CategorySummaryResponseDto[] = paginatedDomainResult.categories.map(
            (category: Category) => mapToDto(CategorySummaryResponseDto, category)
        );
        const responseData = new GetAllCategoriesResponseDto(
            categorySummaryDtos,
            paginatedDomainResult.totalItems,
            paginatedDomainResult.currentPage,
            paginatedDomainResult.itemsPerPage,
            paginatedDomainResult.totalPages
        );
        const plainResponseBody = classToPlain(responseData);
        const responseEntity = new ResponseEntity(
            StatusCodes.OK,
            "Categories retrieved successfully",
            plainResponseBody
        );
        return res.status(responseEntity.getStatus()).json(responseEntity);
    }

    @httpGet("/:id", ValidationMiddleware(GetCategoryByIdRequestParamsDto, 'params'))
    async getCategoryById(
        @request() req: Request,
        @response() res: Response
    ) {
        const paramsDto = (req as any).validatedParams as GetCategoryByIdRequestParamsDto;
        const query = new GetCategoryByIdQuery(paramsDto.id);
        const categoryDomain: Category = await this.getCategoryByIdHandler.execute(query);
        const responseBodyDto = mapToDto(GetCategoryByIdResponseDto, categoryDomain);
        const plainResponseBody = classToPlain(responseBodyDto);
        const responseEntity = new ResponseEntity(
            StatusCodes.OK,
            "Category retrieved successfully",
            plainResponseBody
        );
        return res.status(responseEntity.getStatus()).json(responseEntity);
    }
}