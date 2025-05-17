import { Expose } from 'class-transformer';
import Event from '@domain/event/Event'; // Your domain Event
import MappableResponseDto from '@api/shared/MappableResponseDto';
import Category from '@domain/category/Category'; // If you need to pass category name

export default class EventSummaryResponseDto extends MappableResponseDto {
    @Expose() id!: string;
    @Expose() name!: string;
    @Expose() descriptionShort!: string; // Example: truncated description
    @Expose() date!: string; // ISO string
    @Expose() venueName!: string;
    @Expose() price!: string; // e.g., "100.00 EGP"
    @Expose() photoUrl!: string;
    @Expose() categoryName?: string;

    private constructor(data: Partial<EventSummaryResponseDto>) {
        super();
        Object.assign(this, data);
    }

    
    public static toDtoFrom(entity: Event, associatedCategory?: Category): EventSummaryResponseDto {
        const descValue = entity.description.value;
        return new EventSummaryResponseDto({
            id: String(entity.id),
            name: entity.name.value,
            descriptionShort: descValue.length > 100 ? descValue.substring(0, 97) + '...' : descValue,
            date: entity.date.value.toISOString(),
            venueName: entity.location.name, // Assuming VenueVO has 'name'
            price: `${entity.price.value.toFixed(2)} ${entity.price.currency}`,
            photoUrl: entity.photoUrl.url,
            categoryName: associatedCategory ? associatedCategory.getName().getValue() : undefined,
        });
    }
}