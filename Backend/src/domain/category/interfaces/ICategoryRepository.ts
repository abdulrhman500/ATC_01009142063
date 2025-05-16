import Category from "@domain/category/Category";

export default interface ICategoryRepository {

    getCategoryById(id: number): Promise<Category| null | undefined>;
    getCategoryByName(name: string): Promise<Category| Category | null |undefined>;
    getCategoryByParentId(parentId: number): Promise<Category[]| Category | null |undefined>;
    getCategoryByParentName(parentName: string): Promise<Category[]| Category | null |undefined>;
}