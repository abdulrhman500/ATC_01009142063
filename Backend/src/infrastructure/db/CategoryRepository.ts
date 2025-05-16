import { PrismaClient, Category as PrismaCategoryModel } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '@src/types'; // Assuming TYPES is correctly defined elsewhere
import Category from "@domain/category/Category"; // Assuming the path to your Category domain object
import CategoryName from "@domain/category/value-objects/CategoryName"; // Assuming the path to your CategoryName value object
import ICategoryRepository from "@src/domain/category/interfaces/ICategoryRepository"; // Assuming the path to your interface

/**
 * Repository implementation for managing Category entities using Prisma.
 * This class handles the data access logic for categories, mapping Prisma models
 * to domain objects and vice-versa.
 */
@injectable()
export default class CategoryRepository implements ICategoryRepository {

    private prisma: PrismaClient;

    /**
     * Constructs a new CategoryRepository instance.
     * @param prisma The PrismaClient instance, injected via Inversify.
     */
    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Maps a Prisma Category model to a domain Category object.
     * This is a helper method to keep the mapping logic in one place.
     * You should implement the actual mapping logic based on your Category domain object structure.
     * @param prismaCategory The Prisma Category model.
     * @returns The corresponding domain Category object.
     */
    private mapToDomain(prismaCategory: PrismaCategoryModel): Category {
        // TODO: Implement the actual mapping logic here.
        // This is a placeholder assuming your Category domain object
        // has a static method like fromPrisma or a constructor that accepts the data.
        // Example: return Category.fromPrisma(prismaCategory);
        // Or if using a constructor: return new Category(prismaCategory.id, new CategoryName(prismaCategory.name), prismaCategory.parentId);
        console.warn("Mapping from Prisma model to domain object not fully implemented.");
        // As a temporary measure, returning a placeholder or throwing an error
        // depending on how strict you want to be. For now, returning a basic structure.
        // Replace this with your actual domain object creation logic.
        return {
             id: prismaCategory.id,
             name: new CategoryName(prismaCategory.name), // Assuming CategoryName is a Value Object
             parentId: prismaCategory.parentCategoryId,
             // Add other properties as needed based on your Category domain object
        } as Category; // Cast as Category, but ensure your domain object matches
    }

    /**
     * Maps a domain Category object to data suitable for Prisma creation/update.
     * This is a helper method to keep the mapping logic in one place.
     * @param domainCategory The domain Category object.
     * @returns Data object suitable for Prisma operations.
     */
    private mapToPrismaCreateData(domainCategory: Category): any {
         // TODO: Implement the actual mapping logic here.
         // This is a placeholder. Map properties from your domain object
         // to the structure expected by Prisma's create method.
         return {
             name: domainCategory.name.getValue(), // Assuming CategoryName has a getValue method
             parentId: domainCategory.parentId,
             // Add other properties as needed
         };
    }

     /**
     * Maps a domain Category object to data suitable for Prisma update.
     * This is a helper method to keep the mapping logic in one place.
     * @param domainCategory The domain Category object.
     * @returns Data object suitable for Prisma update operations.
     */
    private mapToPrismaUpdateData(domainCategory: Category): any {
         // TODO: Implement the actual mapping logic here.
         // This is a placeholder. Map properties from your domain object
         // to the structure expected by Prisma's update method.
         // Ensure you only include fields that are allowed to be updated.
         return {
             name: domainCategory.name.getValue(), // Assuming CategoryName has a getValue method
             parentId: domainCategory.parentId,
             // Add other updatable properties as needed
         };
    }


    /**
     * Retrieves a category by its unique ID.
     * @param id The ID of the category to retrieve.
     * @returns A Promise that resolves to the Category domain object or null if not found.
     */
    public async getCategoryById(id: number): Promise<Category | null> {
        const categoryData = await this.prisma.category.findUnique({
            where: {
                id: id,
            },
        });

        if (!categoryData) {
            return null; // Return null if the category is not found
        }

        return this.mapToDomain(categoryData);
    }

    /**
     * Retrieves a category by its unique name.
     * @param name The name of the category to retrieve.
     * @returns A Promise that resolves to the Category domain object or null if not found.
     */
    public async getCategoryByName(name: string): Promise<Category | null> {
        const categoryData = await this.prisma.category.findUnique({
            where: {
                id: await this.prisma.category.findFirst({
                    where: { name },
                    select: { id: true }
                }).then(cat => cat?.id),
                name: name,
            },
        });

        if (!categoryData) {
            return null; // Return null if the category is not found
        }

        return this.mapToDomain(categoryData);
    }

    /**
     * Retrieves all categories that have a specific parent ID.
     * @param parentId The ID of the parent category.
     * @returns A Promise that resolves to an array of Category domain objects.
     */
    public async getCategoryByParentId(parentId: number): Promise<Category[]> {
        const categoriesData = await this.prisma.category.findMany({
            where: {
                parentCategoryId: parentId,
            },
        });

        // Map the Prisma results to Category domain objects
        return categoriesData.map(categoryData => this.mapToDomain(categoryData));
    }

    /**
     * Retrieves all categories that have a parent with a specific name.
     * Note: This requires joining or performing a separate query to find the parent ID first.
     * A more efficient approach might be to query by parent ID if possible.
     * @param parentName The name of the parent category.
     * @returns A Promise that resolves to an array of Category domain objects.
     */
    public async getCategoryByParentName(parentName: string): Promise<Category[]> {
        // First, find the parent category by name
        const parentCategory = await this.prisma.category.findUnique({
            where: {
                id: await this.prisma.category.findFirst({
                    where: { name: parentName },
                    select: { id: true }
                }).then(cat => cat?.id),
                name: parentName,
            },
            select: { // Select only the ID of the parent
                id: true,
            },
        });

        if (!parentCategory) {
            return []; // Return an empty array if the parent category is not found
        }

        // Then, find all categories whose parentId matches the found parent's ID
        const categoriesData = await this.prisma.category.findMany({
            where: {
                parentCategoryId: parentCategory.id,
            },
        });

        // Map the Prisma results to Category domain objects
        return categoriesData.map(categoryData => this.mapToDomain(categoryData));
    }

    /**
     * Creates a new category in the database.
     * @param category The Category domain object to create.
     * @returns A Promise that resolves to the created Category domain object (with ID).
     */
    public async createCategory(category: Category): Promise<Category> {
        const createdCategoryData = await this.prisma.category.create({
            data: this.mapToPrismaCreateData(category),
        });

        return this.mapToDomain(createdCategoryData);
    }

    /**
     * Updates an existing category in the database.
     * @param category The Category domain object with updated data. The ID is used to identify the category.
     * @returns A Promise that resolves to the updated Category domain object.
     * @throws Error if the category with the given ID is not found.
     */
    public async updateCategory(category: Category): Promise<Category> {
         if (category.id === undefined || category.id === null) {
            throw new Error("Category ID is required for update.");
        }

        const updatedCategoryData = await this.prisma.category.update({
            where: {
                id: category.id,
            },
            data: this.mapToPrismaUpdateData(category),
        });

        return this.mapToDomain(updatedCategoryData);
    }

    /**
     * Deletes a category from the database by its ID.
     * @param id The ID of the category to delete.
     * @returns A Promise that resolves when the deletion is complete.
     * @throws Error if the category with the given ID is not found.
     */
    public async deleteCategory(id: number): Promise<void> {
        await this.prisma.category.delete({
            where: {
                id: id,
            },
        });
    }
}
