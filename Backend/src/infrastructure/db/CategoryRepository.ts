import { PrismaClient, Category as PrismaCategoryModel, Prisma } from '@prisma/client'; // Added Prisma for Prisma.sql
import { inject, injectable } from 'inversify';
import { TYPES } from '@src/config/types';
import Category from "@domain/category/Category";
import CategoryName from "@domain/category/value-objects/CategoryName";
import ICategoryRepository, { PaginatedCategoriesResult } from "@src/domain/category/interfaces/ICategoryRepository";

@injectable()
export default class CategoryRepository implements ICategoryRepository {
    private prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private mapToDomain(prismaCategory: PrismaCategoryModel): Category {
        const categoryName = new CategoryName(prismaCategory.name);
     
        return new Category(
            prismaCategory.id,
            categoryName,
            prismaCategory.parentCategoryId
        );
    }

    private mapToPrismaData(domainCategory: Category): any {
        const data: any = {
            name: domainCategory.getName().getValue(), // Assuming getName() returns CategoryName VO
            parentCategoryId: domainCategory.getParentId(), // Assuming getParentId() returns number | null
        };
        // If ID is part of the update/create data and not auto-generated or handled by Prisma implicitly
        // if (domainCategory.getId() !== null && domainCategory.getId() !== undefined) {
        //    data.id = domainCategory.getId();
        // }
        return data;
    }

    public async findByIds(ids: number[]): Promise<Category[]> {
        if (!ids || ids.length === 0) {
            return [];
        }
        const prismaCategories = await this.prisma.category.findMany({
            where: {
                id: {
                    in: ids,
                },
            },
        });
        return prismaCategories.map(pc => this.mapToDomain(pc));
    }

    public async findByNames(names: string[]): Promise<Category[]> {
        if (!names || names.length === 0) {
            return [];
        }
        const prismaCategories = await this.prisma.category.findMany({
            where: {
                name: {
                    in: names,
                    mode: 'insensitive', 
                },
            },
        });
        return prismaCategories.map(pc => this.mapToDomain(pc));
    }

    public async findAllDescendantIds(categoryIds: number[]): Promise<number[]> {
        if (!categoryIds || categoryIds.length === 0) {
            return [];
        }
        categoryIds=  categoryIds.map(id => Number(id))// just to make sure they are numbers not needed but safer 
                

        // recursive CTE to find all descendant IDs including the initial ones
        const result = await this.prisma.$queryRaw<Array<{ id: number }>>(
            Prisma.sql`
                WITH RECURSIVE category_tree AS (
                    -- Anchor member: select the initial categories
                    SELECT id, "parentCategoryId"
                    FROM "Category"
                      WHERE id IN (${Prisma.join(categoryIds)}) 
                
                    UNION ALL
                
                    -- Recursive member: select children of categories already in the tree
                    SELECT c.id, c."parentCategoryId"
                    FROM "Category" c
                    INNER JOIN category_tree ct ON c."parentCategoryId" = ct.id
                )
                SELECT id FROM category_tree;
            `
        );

        return result.map(r => r.id);
    }


    public async fetchAll(): Promise<Category[]> {
        const prismaCategories = await this.prisma.category.findMany({
            // orderBy: { name: 'asc' } 
        });
        return prismaCategories.map(pc => this.mapToDomain(pc));
    }

    public async findAll(options: {
        page: number;
        limit: number;
    }): Promise<PaginatedCategoriesResult> {
        const { page, limit } = options;
        const skip = (page - 1) * limit;

        const [prismaCategories, totalItems] = await this.prisma.$transaction([
            this.prisma.category.findMany({
                skip: skip,
                take: limit,
                orderBy: { name: 'asc' } 
            }),
            this.prisma.category.count(),
        ]);

        const domainCategories = prismaCategories.map(pc => this.mapToDomain(pc));

        return {
            categories: domainCategories,
            totalItems: totalItems,
            currentPage: page,
            itemsPerPage: limit,
            totalPages: Math.ceil(totalItems / limit),
        };
    }

    public async findById(id: number): Promise<Category | null> {
        const prismaCategory = await this.prisma.category.findUnique({
            where: { id: id },
        });
        if (!prismaCategory) {
            return null;
        }
        return this.mapToDomain(prismaCategory);
    }

    public async findByName(name: string): Promise<Category | null> {
     
        const prismaCategory = await this.prisma.category.findUnique({
            where: { name: name },
        });
        if (!prismaCategory) {
            return null;
        }
        return this.mapToDomain(prismaCategory);
    }

    public async findByParentId(parentId: number | null): Promise<Category[]> {
        const prismaCategories = await this.prisma.category.findMany({
            where: { parentCategoryId: parentId },
        });
        return prismaCategories.map(pc => this.mapToDomain(pc));
    }

    public async findByParentName(parentName: string): Promise<Category[]> {
        const parent = await this.prisma.category.findUnique({ // Use findUnique if parentName is unique
            where: { name: parentName },
            select: { id: true },
        });

        if (!parent) {
            return [];
        }

        return this.findByParentId(parent.id);
    }

    public async save(category: Category): Promise<Category> {
        const prismaData = this.mapToPrismaData(category);
        let savedPrismaCategory: PrismaCategoryModel;
        const categoryId = category.getId(); // Get ID from domain entity

        if (categoryId === null || categoryId === undefined) {
            // Create new category
            savedPrismaCategory = await this.prisma.category.create({
                data: prismaData,
            });
        } else {
            // Update existing category
            savedPrismaCategory = await this.prisma.category.update({
                where: { id: categoryId },
                data: prismaData,
            });
        }
        return this.mapToDomain(savedPrismaCategory);
    }

    public async deleteById(id: number): Promise<boolean> {
        try {
            await this.prisma.category.delete({
                where: { id: id },
            });
            return true;
        } catch (error: any) {
            // P2025 is Prisma's error code for "Record to delete does not exist"
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return false; // Or throw NotFoundException if preferred
            }
            // P2003 is for foreign key constraint failed on delete (e.g. if events or child categories still point to it)
            // Your schema has onDelete: Restrict, so this would be caught here.
            // Your application logic (DeleteCategoryHandler) should handle reassigning children/events before deleting.
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                 console.error(`Foreign key constraint failed for category ID ${id}: ${error.message}`);
                 // Depending on desired behavior, you might re-throw a custom domain exception or return false.
                 // For now, let the original error propagate if not P2025.
            }
            throw error;
        }
    }
}