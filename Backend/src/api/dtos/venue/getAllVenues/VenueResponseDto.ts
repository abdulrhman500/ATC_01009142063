import { Expose } from 'class-transformer';
import MappableResponseDto from '@api/shared/MappableResponseDto';
import VenueVO from '@domain/event/value-objects/Venue'; // Your Venue Value Object

export default class VenueResponseDto extends MappableResponseDto {
    @Expose() id!: number; // Changed to number to match VenueVO.id
    @Expose() name!: string;
    @Expose() street!: string;
    @Expose() city!: string;
    @Expose() state?: string;
    @Expose() country!: string;
    @Expose() postalCode?: string;
    @Expose() placeUrl?: string;

    private constructor(data: Partial<VenueResponseDto>) {
        super();
        Object.assign(this, data);
    }

    public static toDtoFrom(venue: VenueVO): VenueResponseDto {
        return new VenueResponseDto({
            id: venue.id, // VenueVO id is number
            name: venue.name,
            street: venue.street,
            city: venue.city,
            state: venue.state,
            country: venue.country,
            postalCode: venue.postalCode,
            placeUrl: venue.placeUrl,
        });
    }
}