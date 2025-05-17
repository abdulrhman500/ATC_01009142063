import { Expose } from 'class-transformer';
import Event from '@domain/event/Event';
import MappableResponseDto from '@api/shared/MappableResponseDto';
import Category from '@domain/category/Category';

export default class EventSummaryResponseDto extends MappableResponseDto {
    @Expose() id!: string;
    @Expose() name!: string;
    @Expose() descriptionShort!: string;
    @Expose() date!: string;
    @Expose() venueName!: string;
    @Expose() price!: string;
    @Expose() photoUrl?: string|undefined;
    @Expose() categoryName?: string;
    @Expose() isBooked!: boolean; // New field, non-optional for simplicity in DTO, will default to false if not customer/booked

    private constructor(data: Partial<EventSummaryResponseDto>) {
        super();
        Object.assign(this, data);
    }

    // Updated toDtoFrom to accept isBooked status
    public static toDtoFrom(
        entity: Event,
        isBookedForCurrentUser: boolean, // New parameter
        associatedCategory?: Category
    ): EventSummaryResponseDto {
        const descValue = entity.description.value;
        return new EventSummaryResponseDto({
            id: String(entity.id),
            name: entity.name.value,
            descriptionShort: descValue.length > 100 ? descValue.substring(0, 97) + '...' : descValue,
            date: entity.date.value.toISOString(),
            venueName: entity.location.name,
            price: `${entity.price.value.toFixed(2)} ${entity.price.currency}`,
            photoUrl: entity?.photoUrl?.url? entity.photoUrl.url: undefined,
            categoryName: associatedCategory ? associatedCategory.getName().getValue() : undefined,
            isBooked: isBookedForCurrentUser, 
        });
    }
}