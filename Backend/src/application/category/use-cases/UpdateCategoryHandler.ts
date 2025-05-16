import { inject, injectable } from "inversify";
import { TYPES } from "@src/types";
import ICategoryRepository from "@domain/category/interfaces/ICategoryRepository";
import Category from "@domain/category/Category";
import UpdateCategoryCommand from "../commands/UpdateCategoryCommand";
import CategoryName from "@domain/category/value-objects/CategoryName";
import { NotFoundException,ConflictException } from "@shared/exceptions/http.exception"; 

@injectable()
export default class UpdateCategoryHandler {
    constructor(
        @inject(TYPES.ICategoryRepository) private readonly categoryRepository: ICategoryRepository
    ) {}

    public async execute(command: UpdateCategoryCommand): Promise<Category> {
        const category = await this.categoryRepository.findById(command.id);

        if (!category) {
            throw new NotFoundException(`Category with ID ${command.id} not found.`);
        }

        let nameChanged = false;
        let parentIdChanged = false;

        let newNameInstance = category.getName(); // Start with current name
        if (command.name !== undefined) {
            const potentialNewName = new CategoryName(command.name);
            if (category.getName().getValue() !== potentialNewName.getValue()) {
                newNameInstance = potentialNewName;
                nameChanged = true;
            }
        }

        let newParentIdValue = category.getParentId(); 
        if (command.parentId !== undefined) { 
                                              
            if (command.parentId === category.getId()) {
                throw new ConflictException("A category cannot be its own parent.");
            }
            // Add more complex cycle detection here if necessary (e.g., via a domain service)
            if (category.getParentId() !== command.parentId) {
                newParentIdValue = command.parentId;
                parentIdChanged = true;
            }
        }

        if (!nameChanged && !parentIdChanged) {
            return category; // No actual changes detected, return the original category
        }

        // Create a new Category instance with updated values.
        // This approach is good if your Category domain entity is immutable or
        // if you prefer to reconstruct it for updates.
        const updatedCategoryInstance = new Category(
            category.getId()!, // ID must be non-null as category was found
            newNameInstance,
            newParentIdValue
        );

        return this.categoryRepository.save(updatedCategoryInstance);
    }
}