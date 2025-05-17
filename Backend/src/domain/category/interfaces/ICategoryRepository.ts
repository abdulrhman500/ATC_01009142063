import Category from "@domain/category/Category";
export interface PaginatedCategoriesResult {
    categories: Category[];
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
}
export default interface ICategoryRepository {
    findAll(options: {
        page: number;
        limit: number;
    }): Promise<PaginatedCategoriesResult>;
    
    findById(id: number): Promise<Category | null>;
    findByName(name: string): Promise<Category | null>;
    findByParentId(parentId: number | null): Promise<Category[]>;
    findByParentName(parentName: string): Promise<Category[]>;
    save(category: Category): Promise<Category>;
    deleteById(id: number): Promise<boolean>;
    fetchAll(): Promise<Category[]>; // <-- ADD THIS LINE
  
    findByIds(ids: number[]): Promise<Category[]>;
    findByNames(names: string[]): Promise<Category[]>;
    findAllDescendantIds(categoryIds: number[]): Promise<number[]>; // Crucial for hierarchical filtering
}