// src/application/category/use-cases/GetCategoryTreeHandler.ts
import { inject, injectable } from "inversify";
import { TYPES } from "@src/types";
import ICategoryRepository from "@domain/category/interfaces/ICategoryRepository";
import Category from "@domain/category/Category";
// Import your DTOs
import GetCategoryTreeResponseDto, { CategoryTreeNodeDto } from "@api/dtos/category/GetCategoryTree/GetCategoryTreeResponseDto"; // Adjust path if needed

@injectable()
export default class GetCategoryTreeHandler {
    private readonly categoryRepository: ICategoryRepository;

    constructor(
        @inject(TYPES.ICategoryRepository) categoryRepository: ICategoryRepository
    ) {
        this.categoryRepository = categoryRepository;
    }

    // Ensure the return type is Promise<GetCategoryTreeResponseDto>
    public async execute(): Promise<GetCategoryTreeResponseDto> {
        const allCategories: Category[] = await this.categoryRepository.findAll();
        
        // Assuming this.buildTree correctly returns CategoryTreeNodeDto[]
        // where each node is structured as expected (id, name, parentId, children)
        const treeNodes: CategoryTreeNodeDto[] = this.buildTree(allCategories); 

        // Wrap the array in your GetCategoryTreeResponseDto
        return new GetCategoryTreeResponseDto(treeNodes);
    }

    private buildTree(categories: Category[]): CategoryTreeNodeDto[] {
        // (Your existing logic to build the flat list into a tree of CategoryTreeNodeDto-like objects)
        // Example sketch:
        const categoryMap = new Map<number, CategoryTreeNodeDto>();
        const rootNodes: CategoryTreeNodeDto[] = [];

        for (const category of categories) {
            const id = category.getId();
            if (id === null) continue;

            const node: CategoryTreeNodeDto = { // Or new CategoryTreeNodeDto(...) if it's a class and needs instantiation
                id: String(id),
                name: category.getName().getValue(),
                parentId: category.getParentId() !== null ? String(category.getParentId()) : null,
                children: [],
            };
            categoryMap.set(id, node);
        }

        for (const category of categories) {
            const categoryId = category.getId();
            if (categoryId === null) continue;

            const node = categoryMap.get(categoryId);
            if (!node) continue;

            const parentId = category.getParentId();
            if (parentId !== null && categoryMap.has(parentId)) {
                const parentNode = categoryMap.get(parentId)!;
                parentNode.children.push(node);
            } else {
                rootNodes.push(node);
            }
        }
        return rootNodes;
    }
}