import { Expose, Type } from 'class-transformer';
import CategorySummaryResponseDto from '@api/dtos/category/CategorySummaryResponseDto';



export default class GetAllCategoriesResponseDto {
    @Expose()
    @Type(() => CategorySummaryResponseDto)
    data: CategorySummaryResponseDto  []; // The actual items for the current page

    @Expose()
    totalItems: number; // Total number of items across all pages

    @Expose()
    currentPage: number; // The current page number

    @Expose()
    itemsPerPage: number; // The number of items requested per page (limit)

    @Expose()
    totalPages: number; // Total number of pages available

    constructor(
        data: CategorySummaryResponseDto[],
        totalItems: number,
        currentPage: number,
        itemsPerPage: number,
        totalPages: number
    ) {
        this.data = data;
        this.totalItems = totalItems;
        this.currentPage = currentPage;
        this.itemsPerPage = itemsPerPage;
        this.totalPages = totalPages;
    }
}