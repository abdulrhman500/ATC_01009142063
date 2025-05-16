import { inject, injectable } from "inversify";
import { TYPES } from "@src/config/types";
import ICategoryRepository from "@domain/category/interfaces/ICategoryRepository";
import DeleteCategoryCommand from "../commands/DeleteCategoryCommand";
import Category from "@domain/category/Category";
import { NotFoundException } from "@shared/exceptions/http.exception"; 
import { BadRequestException } from "@shared/exceptions/http.exception";
import Constants from "@src/shared/Constants";
import IEventRepository from "@domain/event/interfaces/IEventRepository";


@injectable()
export default class DeleteCategoryHandler {
    private readonly categoryRepository: ICategoryRepository;
    private readonly eventRepository: IEventRepository; 

    constructor(
        @inject(TYPES.ICategoryRepository) categoryRepository: ICategoryRepository,
        @inject(TYPES.IEventRepository) eventRepository: IEventRepository 
    ) {
        this.categoryRepository = categoryRepository;
        this.eventRepository = eventRepository;
    }

    public async execute(command: DeleteCategoryCommand): Promise<boolean> {
        const categoryToDelete = await this.categoryRepository.findById(command.id);
        if (!categoryToDelete) {
            throw new NotFoundException(`Category with ID ${command.id} not found.`);
        }

        if (categoryToDelete.getName().getValue() === Constants.GENERAL_CATEGORY_NAME) {
console.log("***********************1*********");

            throw new BadRequestException(`The "${Constants.GENERAL_CATEGORY_NAME}" category cannot be deleted.`);
        }

        // 1. Get the "General" category
        const generalCategory = await this.categoryRepository.findByName(Constants.GENERAL_CATEGORY_NAME);
        if (!generalCategory || generalCategory.getId() === null) {
            throw new Error(`Critical setup: The "${Constants.GENERAL_CATEGORY_NAME}" category is missing or invalid.`);
        }
        const generalCategoryId = generalCategory.getId()!;

        // Prevent reassigning to itself if, for some reason, generalCategory ID was the one being deleted
        // (already caught by name check, but good for robustness if ID lookup was different)
        if (generalCategoryId === command.id) {
             throw new BadRequestException(`Cannot delete the "${Constants.GENERAL_CATEGORY_NAME}" category by reassigning items to itself.`);
        }

        // 2. Reassign child categories to "General" category
        const childCategories = await this.categoryRepository.findByParentId(command.id);
        for (const child of childCategories) {
            // Avoid re-parenting "General" category if it somehow became a child
            if (child.getId() === generalCategoryId) {
                // This might indicate a data issue or a scenario needing special handling.
                // For now, we can skip or log it.
                console.warn(`Skipping re-parenting of category ID ${child.getId()} as it is the target 'General' category.`);
                continue;
            }
            // Create a new Category instance with the updated parentId
            const updatedChild = new Category(
                child.getId(),
                child.getName(),
                generalCategoryId // New parentId
            );
            await this.categoryRepository.save(updatedChild);
        }

        // 3. Reassign Events from the category-to-be-deleted to the "General" category
        // This step is crucial because your Prisma schema for Event.category has onDelete: Restrict.
        await this.eventRepository.reassignEventsCategory(command.id, generalCategoryId);

        // 4. Finally, delete the category
        const deletionResult = await this.categoryRepository.deleteById(command.id);
        if (!deletionResult) {
            // This could happen if deleteById fails for reasons other than "not found"
            // (which was checked upfront) or if the reassignments above were incomplete
            // and 'Restrict' was somehow still triggered (unlikely if logic is correct).
            throw new Error(`Failed to delete category with ID ${command.id}. Ensure all references were reassigned.`);
        }
        return deletionResult; // true if successful
    }
}