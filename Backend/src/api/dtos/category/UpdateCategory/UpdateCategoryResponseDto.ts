// src/api/dtos/category/UpdateCategory/UpdateCategoryResponseDto.ts
import { Expose } from 'class-transformer';
import Category from '@domain/category/Category'; // Ensure this path is correct
import MappableResponseDto from '@api/shared/MappableResponseDto'; // Using your import path

export default class UpdateCategoryResponseDto extends MappableResponseDto {
    @Expose() // For classToPlain: ensures this property is included in the final JSON
    id!: string; // As per your previous definition, 'id' is a non-nullable string for an update response

    @Expose()
    name!: string;

    @Expose()
    parentId!: string | null;

    // A private constructor encourages using the static factory method for creation
    private constructor() {
        super(); // Call the base class constructor if it exists and does something
    }

    /**
     * Creates an UpdateCategoryResponseDto instance from a Category domain entity.
     * This method "overrides" (hides) the static method from MappableResponseDto.
     * @param category The Category domain entity.
     * @returns A new instance of UpdateCategoryResponseDto.
     */
    public static toDtoFrom(category: Category): UpdateCategoryResponseDto {
        const dto = new UpdateCategoryResponseDto();

        const domainId = category.getId();
        // Since dto.id is non-nullable (id!: string), we should ensure domainId is not null.
        // An updated category should always have an ID.
        if (domainId === null) {
            console.error("Error mapping to UpdateCategoryResponseDto: The provided Category domain object has a null ID, which is not expected for an update response.");
            throw new Error("Cannot create UpdateCategoryResponseDto from a Category with a null ID.");
        }
        dto.id = String(domainId);

        // Assumes category.getName() returns an object (e.g., CategoryName value object)
        // that has a getValue() method returning the primitive string.
        dto.name = category.getName().getValue();

        const domainParentId = category.getParentId();
        dto.parentId = domainParentId !== null ? String(domainParentId) : null;

        return dto;
    }
}