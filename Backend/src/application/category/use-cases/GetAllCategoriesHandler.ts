import { inject, injectable } from "inversify";
import { TYPES } from "@src/config/types";
import ICategoryRepository, { PaginatedCategoriesResult } from "@domain/category/interfaces/ICategoryRepository";
import GetAllCategoriesQuery from "@application/category/queries/GetAllCategoriesQuery";

@injectable()
export default class GetAllCategoriesHandler {
    constructor(
        @inject(TYPES.ICategoryRepository) private readonly categoryRepository: ICategoryRepository
    ) {}

    public async execute(query: GetAllCategoriesQuery): Promise<PaginatedCategoriesResult> {
        
        return this.categoryRepository.findAll({
            page: query.page,
            limit: query.limit,
        });
        
        // { categories: Category[], totalItems, currentPage, itemsPerPage, totalPages }
        // where 'categories' contains domain objects.
    }
}