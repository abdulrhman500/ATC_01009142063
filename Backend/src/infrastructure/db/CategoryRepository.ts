import { PrismaClient, Category as PrismaCategoryModel } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '@src/config/types';
import Category from "@domain/category/Category";
import CategoryName from "@domain/category/value-objects/CategoryName";
import ICategoryRepository, { PaginatedCategoriesResult } from "@src/domain/category/interfaces/ICategoryRepository"; // Ensure this path is correct for your project

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
        // This helper creates data suitable for Prisma's create/update operations.
        // Adjust based on your Prisma schema and how relations (like parentCategory) are handled.
        const data: any = {
            name: domainCategory.name.getValue(),
            parentCategoryId: domainCategory.parentId,
        };
        return data;
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

        // Use Prisma transaction to get both items and total count consistently
        const [prismaCategories, totalItems] = await this.prisma.$transaction([
            this.prisma.category.findMany({
                skip: skip,
                take: limit,
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
        const prismaCategory = await this.prisma.category.findFirst({
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
        const parent = await this.prisma.category.findFirst({
            where: { name: parentName },
            select: { id: true },
        });

        if (!parent) {
            return [];
        }

        const prismaCategories = await this.prisma.category.findMany({
            where: { parentCategoryId: parent.id },
        });
        return prismaCategories.map(pc => this.mapToDomain(pc));
    }

    public async save(category: Category): Promise<Category> {
        const prismaData = this.mapToPrismaData(category);
        let savedPrismaCategory: PrismaCategoryModel;

        if (category.id === null || category.id === undefined) {
            savedPrismaCategory = await this.prisma.category.create({
                data: prismaData,
            });
        } else {
            savedPrismaCategory = await this.prisma.category.update({
                where: { id: category.id },
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
            if (error.code === 'P2025') { // Prisma error code for "Record to delete does not exist"
                return false;
            }
            throw error;
        }
    }
}