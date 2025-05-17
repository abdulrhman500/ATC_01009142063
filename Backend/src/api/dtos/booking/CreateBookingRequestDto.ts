// Backend: src/api/dtos/booking/CreateBookingRequestDto.ts (Corrected)
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsInt, Min } from 'class-validator';

export default class CreateBookingRequestDto {
    @Expose()
    @IsNotEmpty({ message: "Event ID is required." })
    eventId!: number|string;
}