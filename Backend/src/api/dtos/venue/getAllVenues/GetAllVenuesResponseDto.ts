import { Expose, Type } from 'class-transformer';
import MappableResponseDto from '@api/shared/MappableResponseDto';
import VenueResponseDto from './VenueResponseDto';
import VenueVO from '@domain/event/value-objects/Venue'; // Your Venue Value Object

export default class GetAllVenuesResponseDto extends MappableResponseDto {
    @Expose()
    @Type(() => VenueResponseDto)
    data!: VenueResponseDto[];

    private constructor(data: Partial<GetAllVenuesResponseDto>) {
        super();
        Object.assign(this, data);
    }

    public static toDtoFrom(venues: VenueVO[]): GetAllVenuesResponseDto {
        const instance = new GetAllVenuesResponseDto({
            data: venues.map(vo => VenueResponseDto.toDtoFrom(vo))
        });
        return instance;
    }
}