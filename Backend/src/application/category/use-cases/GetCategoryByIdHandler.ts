import { inject, injectable } from "inversify";
import { TYPES } from "@src/config/types";
import ICategoryRepository from "@domain/category/interfaces/ICategoryRepository";
import Category from "@domain/category/Category";
import GetCategoryByIdQuery from "../queries/GetCategoryByIdQuery";
import { NotFoundException } from "@shared/exceptions/http.exception"; // Adjust path if needed

@injectable()
export default class GetCategoryByIdHandler {
    constructor(
        @inject(TYPES.ICategoryRepository) private readonly categoryRepository: ICategoryRepository
    ) {}

    public async execute(query: GetCategoryByIdQuery): Promise<Category> {
        const category = await this.categoryRepository.findById(query.id);

        if (!category) {
            throw new NotFoundException(`Category with ID ${query.id} not found.`);
        }
        return category; // Returns the Category domain object
    }
}