import { Expose, Type, Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, MinLength, IsArray } from 'class-validator';

// Helper to transform comma-separated string to number array
const transformToArrayOfNumbers = ({ value }: { value: any }): number[] | undefined => {
    if (typeof value === 'string' && value.trim() !== '') {
        return value.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    }
    if (Array.isArray(value)) { // If it's already an array (e.g. from query parser middleware)
        return value.map(id => parseInt(String(id), 10)).filter(id => !isNaN(id));
    }
    return undefined;
};

// Helper to transform comma-separated string to string array
const transformToArrayOfStrings = ({ value }: { value: any }): string[] | undefined => {
    if (typeof value === 'string' && value.trim() !== '') {
        return value.split(',').map(name => name.trim()).filter(name => name.length > 0);
    }
     if (Array.isArray(value)) {
        return value.map(name => String(name).trim()).filter(name => name.length > 0);
    }
    return undefined;
};

export default class GetAllEventsRequestDto {
    @Expose()
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Page must be an integer.' })
    @Min(1, { message: 'Page must be at least 1.' })
    page?: number = 1;

    @Expose()
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer.' })
    @Min(1, { message: 'Limit must be at least 1.' })
    @Max(100, { message: 'Limit cannot exceed 100.' })
    limit?: number = 10;

    @Expose()
    @IsOptional()
    @IsString({ message: 'Text search term must be a string.' })
    @MinLength(1, { message: 'Text search term must not be empty if provided.' })
    textSearch?: string;

    @Expose()
    @IsOptional()
    @Transform(transformToArrayOfNumbers, { toClassOnly: true })
    @IsArray({ message: 'Category IDs must be an array of numbers after transformation.' }) // Validates after transform
    @IsInt({ each: true, message: 'Each category ID must be an integer.'}) // Validates after transform
    categoryIds?: number[]; // Expect comma-separated string like "1,2,3" or an array from query parser

    @Expose()
    @IsOptional()
    @Transform(transformToArrayOfStrings, { toClassOnly: true })
    @IsArray({ message: 'Category names must be an array of strings after transformation.' })
    @IsString({ each: true, message: 'Each category name must be a string.'})
    categoryNames?: string[]; // Expect comma-separated string like "Pop,Rock"
}