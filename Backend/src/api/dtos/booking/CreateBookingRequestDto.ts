// Backend: src/api/dtos/booking/CreateBookingRequestDto.ts (Corrected)
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsInt, Min } from 'class-validator';

export default class CreateBookingRequestDto {
    @Expose()
    @IsNotEmpty({ message: "Event ID is required." })
    @Type(() => Number) // Transforms incoming string (e.g., from JSON) to number for validation
    @IsInt({ message: "Event ID must be an integer." })
    @Min(1, { message: "Event ID must be a positive number."})
    eventId!: number; // Expect a number after transformation
}