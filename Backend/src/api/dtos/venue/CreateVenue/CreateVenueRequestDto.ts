import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUrl } from 'class-validator';

export default class CreateVenueRequestDto {
    @Expose()
    @IsNotEmpty({ message: 'Venue name is required.' })
    @IsString()
    @MaxLength(100, { message: 'Venue name cannot exceed 100 characters.' })
    name!: string;

    @Expose()
    @IsNotEmpty({ message: 'Street address is required.' })
    @IsString()
    @MaxLength(100, { message: 'Street address cannot exceed 100 characters.' })
    street!: string;

    @Expose()
    @IsNotEmpty({ message: 'City is required.' })
    @IsString()
    @MaxLength(50, { message: 'City name cannot exceed 50 characters.' })
    city!: string;

    @Expose()
    @IsNotEmpty({ message: 'Country is required.' }) // Assuming country is required
    @IsString()
    @MaxLength(50, { message: 'Country name cannot exceed 50 characters.' })
    country!: string;

    @Expose()
    @IsString()
    @IsNotEmpty({ message: 'State is required.' })
    @MaxLength(50, { message: 'State name cannot exceed 50 characters.' })
    state?: string;

    @Expose()
    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Postal code cannot exceed 20 characters.' })
    postalCode?: string;

    @Expose()
    @IsOptional()
    @IsUrl({}, { message: 'Place URL must be a valid URL if provided.'})
    placeUrl?: string;
}