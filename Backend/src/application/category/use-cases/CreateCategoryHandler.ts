import CreateCategoryCommand from "@application/category/commands/CreateCategoryCommand";
import Category from "@domain/category/Category";
import ICategoryRepository from "@domain/category/interfaces/ICategoryRepository";
import CategoryName from "@domain/category/value-objects/CategoryName";
import { inject, injectable } from "inversify";
import { TYPES } from "@src/types";

@injectable()
export default class CreateCategoryHandler {
    private readonly categoryRepository: ICategoryRepository;

    constructor(
        @inject(TYPES.ICategoryRepository) categoryRepository: ICategoryRepository
    ) {
        this.categoryRepository = categoryRepository;
    }

    public async execute(command: CreateCategoryCommand): Promise<Category> {
        const name = new CategoryName(command.getName());
        const parentId = command.getParentId();

        const newCategory = new Category(
            null,
            name,
            parentId
        );

        const savedCategory = await this.categoryRepository.save(newCategory);

        return savedCategory;
    }
}