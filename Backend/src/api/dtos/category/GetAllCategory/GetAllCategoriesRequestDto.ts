import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export default class GetAllCategoriesRequestDto {
    @IsOptional()
    @Type(() => Number) // Transforms query param string to number
    @IsInt({ message: 'Page must be an integer number.' })
    @Min(1, { message: 'Page must be at least 1.' })
    page?: number = 1; // Default to page 1

    @IsOptional()
    @Type(() => Number) // Transforms query param string to number
    @IsInt({ message: 'Limit must be an integer number.' })
    @Min(1, { message: 'Limit must be at least 1.' })
    @Max(100, { message: 'Limit cannot be more than 100.' }) // Example: cap the limit
    limit?: number = 10; // Default to 10 items per page

}