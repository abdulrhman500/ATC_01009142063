// src/api/dtos/category/GetAllCategory/GetAllCategoriesResponseDto.ts
import { Expose } from 'class-transformer';
import CategorySummaryResponseDto from '@api/dtos/category/CategorySummaryResponseDto';
import { PaginatedCategoriesResult } from '@domain/category/interfaces/ICategoryRepository';
import MappableResponseDto from '@api/shared/MappableResponseDto';
export default class GetAllCategoriesResponseDto extends MappableResponseDto {
    @Expose()
    data: CategorySummaryResponseDto[];

    @Expose()
    totalItems: number;

    @Expose()
    currentPage: number;

    @Expose()
    itemsPerPage: number;

    @Expose()
    totalPages: number;

    constructor(
        data: CategorySummaryResponseDto[],
        totalItems: number,
        currentPage: number,
        itemsPerPage: number,
        totalPages: number
    ) {
        super();
        this.data = data;
        this.totalItems = totalItems;
        this.currentPage = currentPage;
        this.itemsPerPage = itemsPerPage;
        this.totalPages = totalPages;
    }

    public static toDtoFrom(paginatedResult: PaginatedCategoriesResult): GetAllCategoriesResponseDto {
        const categorySummaryDtos = paginatedResult.categories.map(category =>
            CategorySummaryResponseDto.toDtoFrom(category) // Using the new method name here
        );

        return new GetAllCategoriesResponseDto(
            categorySummaryDtos,
            paginatedResult.totalItems,
            paginatedResult.currentPage,
            paginatedResult.itemsPerPage,
            paginatedResult.totalPages
        );
    }
}