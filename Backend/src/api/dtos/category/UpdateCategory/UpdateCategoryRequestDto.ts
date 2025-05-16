import { IsString, IsOptional, IsNumber, MinLength, ValidateIf } from 'class-validator';


export default class UpdateCategoryRequestDto {
    // @ApiPropertyOptional({ description: 'The new name of the category', example: 'Updated Electronics' })
    @IsOptional()
    @IsString({ message: 'Name must be a string' })
    @MinLength(1, { message: 'Name must not be empty if provided' })
    name?: string;

    // @ApiPropertyOptional({ description: 'The new parent ID for the category, or null to set as a root category', example: 1, nullable: true })
    @IsOptional()
    @ValidateIf((_object, value) => value !== null) // Validates IsNumber only if value is not null
    @IsNumber({}, { message: 'Parent ID must be a number if provided and not null' })
    parentId?: number | null;
}