// src/api/dtos/category/tree/CategoryTreeNodeDto.ts (or your chosen path)
import { Expose } from 'class-transformer';
// We remove @Type here because the 'children' array will be populated by our static toDtoFrom method,
// not by class-transformer's plainToInstance based on type metadata for this specific domain-to-DTO flow.
// If you have other use cases where CategoryTreeNodeDto is created from plain objects via plainToInstance,
// then @Type might still be relevant for those cases.
import MappableResponseDto from '@api/shared/MappableResponseDto'; // Ensure this path is correct
import Category from '@src/domain/category/Category'; // Ensure this path is correct

export class CategoryTreeNodeDto extends MappableResponseDto {
    @Expose()
    id!: string | null;

    @Expose()
    name!: string;

    @Expose()
    parentId!: string | null;

    @Expose()
    // @Type(() => CategoryTreeNodeDto) // Removed: children are mapped recursively by toDtoFrom
    children!: CategoryTreeNodeDto[];

    // Private constructor to encourage use of the static factory method
    private constructor() {
        super(); // Call base constructor
    }

    /**
     * Creates a CategoryTreeNodeDto instance (including its children recursively)
     * from a Category domain entity.
     * @param category The Category domain entity, expected to have a getChildren() method.
     * @returns A new instance of CategoryTreeNodeDto.
     */
    public static toDtoFrom(category: Category): CategoryTreeNodeDto {
        const dto = new CategoryTreeNodeDto();

        const domainId = category.getId();
        dto.id = domainId !== null ? String(domainId) : null;

        dto.name = category.getName().getValue(); // Assumes CategoryName value object

        const domainParentId = category.getParentId();
        dto.parentId = domainParentId !== null ? String(domainParentId) : null;

        // Recursively map children
        // Assumes category.getChildren() returns Category[]
        const domainChildren = category.getChildren ? category.getChildren() : [];
        dto.children = domainChildren.map(childCategory =>
            CategoryTreeNodeDto.toDtoFrom(childCategory) // Recursive call
        );

        return dto;
    }

}


export default class GetCategoryTreeResponseDto extends MappableResponseDto {
    @Expose()
    // @Type(() => CategoryTreeNodeDto) // Correctly removed as mapping is manual via CategoryTreeNodeDto.toDtoFrom
    data: CategoryTreeNodeDto[];

    private constructor(data: CategoryTreeNodeDto[]) {
        super();
        this.data = data;
    }

    /**
     * Creates a GetCategoryTreeResponseDto instance from an array of root Category domain entities.
     * @param rootCategories An array of the root Category domain entities for the tree.
     * Each Category is expected to have a getChildren() method for recursive mapping.
     * @returns A new instance of GetCategoryTreeResponseDto.
     */
    public static toDtoFrom(rootCategories: Category[]): GetCategoryTreeResponseDto {
        const treeNodeDtos = rootCategories.map(rootCategory =>
            CategoryTreeNodeDto.toDtoFrom(rootCategory)
        );
        return new GetCategoryTreeResponseDto(treeNodeDtos);
    }
}