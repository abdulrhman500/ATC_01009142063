import { Expose, Type } from 'class-transformer';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsISO8601, IsInt, IsNumber, Min, IsUrl, IsOptional, IsEnum, IsIn } from 'class-validator';
import Constants from "@src/shared/Constants" // Assuming you define this

export default class CreateEventRequestDto {
    @Expose()
    @IsNotEmpty({ message: 'Event name is required.' })
    @IsString()
    @MinLength(3, { message: 'Event name must be at least 3 characters.' })
    @MaxLength(100, { message: 'Event name cannot exceed 100 characters.' })
    name!: string;

    @Expose()
    @IsNotEmpty({ message: 'Event description is required.' })
    @IsString()
    @MinLength(10, { message: 'Event description must be at least 10 characters.' })
    @MaxLength(1000, { message: 'Event description cannot exceed 1000 characters.' })
    description!: string;

    @Expose()
    @IsNotEmpty({ message: 'Event date is required.' })
    @IsISO8601({}, { message: 'Event date must be a valid ISO 8601 date string.' })
    date!: string; // Will be converted to Date object

    @Expose()
    @IsNotEmpty({ message: 'Venue ID is required.' })
    @IsInt({ message: 'Venue ID must be an integer.' })
    @Type(() => Number)
    venueId!: number;

    @Expose()
    @IsOptional()
    @IsInt({ message: 'Category ID must be an integer if provided.' })
    @Type(() => Number)
    categoryId?: number | null;

    @Expose()
    @IsNotEmpty({ message: 'Price value is required.' })
    @IsNumber({}, { message: 'Price value must be a number.' })
    @Min(0, { message: 'Price value cannot be negative.'})
    @Type(() => Number)
    priceValue!: number;

    @Expose()
    @IsNotEmpty({ message: 'Price currency is required.' })
    @IsString()
    @IsIn(Constants.SUPPORTED_CURRENCIES, { message: `Currency must be one of: ${Constants.SUPPORTED_CURRENCIES.join(', ')}`})
    priceCurrency!: string;

    @Expose()
    @IsNotEmpty({ message: 'Photo URL is required.' })
    @IsUrl({}, { message: 'Photo URL must be a valid URL.' })
    photoUrl?: string;
}