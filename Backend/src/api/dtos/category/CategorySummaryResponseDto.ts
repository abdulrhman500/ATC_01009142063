// src/api/dtos/category/CategorySummaryResponseDto.ts
import { Expose } from 'class-transformer';
import Category from '@domain/category/Category';
import MappableResponseDto from '@api/shared/MappableResponseDto';
export default class CategorySummaryResponseDto extends MappableResponseDto{
    @Expose()
    id!: string | null;

    @Expose()
    name!: string;

    @Expose()
    parentId!: string | null; // Example

     constructor() {super()}

    public static toDtoFrom(category: Category): CategorySummaryResponseDto {
        const dto = new CategorySummaryResponseDto();
        const domainId = category.getId();
        dto.id = domainId !== null ? String(domainId) : null;
        dto.name = category.getName().getValue();
        const domainParentId = category.getParentId();
        dto.parentId = domainParentId !== null ? String(domainParentId) : null;
        return dto;
    }
}