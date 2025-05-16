import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export default class GetCategoryByIdRequestParamsDto {
    @Type(() => Number) // Transforms the path parameter string to a number
    @IsInt({ message: 'Category ID must be an integer number.' })
    @Min(1, { message: 'Category ID must be a positive number.' })
    id!: number; // Will be populated from req.params.id
}