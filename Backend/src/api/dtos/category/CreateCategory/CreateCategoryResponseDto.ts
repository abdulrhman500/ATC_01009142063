import { Expose } from 'class-transformer'; 
import Category from '@domain/category/Category';
import MappableResponseDto from '@src/api/shared/MappableResponseDto';

export default class CreateCategoryResponseDto extends MappableResponseDto{
    @Expose() // This decorator is for classToPlain, if you use it later
    id!: string | null;

    @Expose() // This decorator is for classToPlain
    name!: string;

    @Expose() // This decorator is for classToPlain
    parentCategoryId!: string | null;

     private constructor() {super()}

    /**
     * Creates a CreateCategoryResponseDto instance from a Category domain entity.
     * @param category The Category domain entity.
     * @returns A new instance of CreateCategoryResponseDto.
     */
    public static toDtoFrom(category: Category): CreateCategoryResponseDto {
        const dto = new CreateCategoryResponseDto();

        const domainId = category.getId();
        dto.id = domainId !== null ? String(domainId) : null;

      
        dto.name = category.getName().getValue();

        const domainParentId = category.getParentId();
        dto.parentCategoryId = domainParentId !== null ? String(domainParentId) : null;

        return dto;
    }
}