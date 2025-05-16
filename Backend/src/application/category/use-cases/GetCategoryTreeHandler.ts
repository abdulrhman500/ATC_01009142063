// src/application/category/use-cases/GetCategoryTreeHandler.ts
import { inject, injectable } from "inversify";
import { TYPES } from "@src/config/types";
import ICategoryRepository from "@domain/category/interfaces/ICategoryRepository";
import Category from "@domain/category/Category";
// Removed DTO imports as this handler will now return domain objects

@injectable()
export default class GetCategoryTreeHandler {
    private readonly categoryRepository: ICategoryRepository;

    constructor(
        @inject(TYPES.ICategoryRepository) categoryRepository: ICategoryRepository
    ) {
        this.categoryRepository = categoryRepository;
    }

    /**
     * Fetches all categories and structures them as a tree of Category domain objects.
     * @returns A promise that resolves to an array of root Category domain objects,
     * each potentially containing populated 'children' array of Category domain objects.
     */
    public async execute(): Promise<Category[]> {
        const allCategories: Category[] = await this.categoryRepository.fetchAll();

        // buildDomainTree will now construct a tree of Category domain objects
        // and return the root nodes of that domain tree.
        const categoryDomainTreeRoots: Category[] = this.buildDomainTree(allCategories);

        return categoryDomainTreeRoots;
    }

    /**
     * Builds a tree from a flat list of Category domain entities.
     * Each node in the returned tree is a Category entity, with its 'children'
     * property populated with its child Category entities.
     * @param flatCategories A flat list of all Category domain entities.
     * @returns An array of root Category domain entities.
     */
    private buildDomainTree(flatCategories: Category[]): Category[] {
        // A map to hold references to Category instances for quick lookup.
        // We'll store the actual Category instances from flatCategories (or clones/new instances).
        const categoryMap = new Map<number, Category>();
        const rootDomainNodes: Category[] = [];

        // First pass: Ensure all categories from the flat list are in the map
        // and that their 'children' arrays are initialized (if not already by the constructor).
        // It's crucial that the Category instances in categoryMap are the ones we link.
        for (const category of flatCategories) {
            const id = category.getId();
            if (id === null) continue;

            // If the Category instances from fetchAll don't have 'children' initialized as an empty array,
            // you might need to create new instances or ensure they are prepared.
            // Assuming Category constructor initializes `children` to `[]` if not provided.
            if (!category.children) {
                 // This line might be needed if 'children' isn't auto-initialized to []
                 // and isn't readonly in a way that prevents this.
                 (category as any).children = [];
            }
            categoryMap.set(id, category);
        }

        // Second pass: Link children to their parents.
        categoryMap.forEach(categoryNode => { // categoryNode is a Category instance
            const parentId = categoryNode.getParentId();
            if (parentId !== null) {
                const parentNode = categoryMap.get(parentId);
                if (parentNode) {
                    // Ensure parentNode.children is modifiable or use an addChild method
                    parentNode.children.push(categoryNode);
                } else {
                    // Parent ID exists but parent not in map (e.g. orphaned data, or not fetched)
                    // Or, this category without a found parent in the current list is a root.
                    rootDomainNodes.push(categoryNode);
                }
            } else {
                // No parentId means it's a root node
                rootDomainNodes.push(categoryNode);
            }
        });

        return rootDomainNodes;
    }
}