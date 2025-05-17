import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export default class CreateBookingRequestDto {

    @IsNotEmpty({ message: "category name is required" })
    eventId: number | string

    constructor(name: string, parentId: number) {
        this.eventId = name;
    }


}