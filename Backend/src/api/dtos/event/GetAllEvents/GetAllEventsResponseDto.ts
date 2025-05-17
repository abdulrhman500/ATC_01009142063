import { Expose, Type } from 'class-transformer';
import MappableResponseDto from '@api/shared/MappableResponseDto';
import EventSummaryResponseDto from './EventSummaryResponseDto';
import { PaginatedEventsHandlerResult } from '@application/event/use-cases/GetAllEventsHandler';
import Category from '@domain/category/Category';
import DomainEvent from '@domain/event/Event'; // Use an alias for your domain Event

export default class GetAllEventsResponseDto extends MappableResponseDto {
    @Expose()
    @Type(() => EventSummaryResponseDto)
    data!: EventSummaryResponseDto[];

    @Expose() totalItems!: number;
    @Expose() currentPage!: number;
    @Expose() itemsPerPage!: number;
    @Expose() totalPages!: number;

    private constructor(data: Partial<GetAllEventsResponseDto>) {
        super();
        Object.assign(this, data);
    }

    public static fromPaginatedResult(result: PaginatedEventsHandlerResult): GetAllEventsResponseDto {
        // Explicitly tell map that eventEntity is your DomainEvent
        const eventDtos = result.events.map((eventEntity: DomainEvent) => {
            let associatedCategory: Category | undefined = undefined;
            // Use the getCategoryId method from your DomainEvent
            const categoryId = eventEntity.getCategoryId?.(); 

            if (categoryId != null && result.categoriesMap) { // Check for null or undefined
                associatedCategory = result.categoriesMap.get(categoryId);
            }

            // Determine if the event is booked by the current user
            // Ensure eventEntity.id is number here
            const isBooked = result.bookedEventIdsForCurrentUser?.has(eventEntity.id) ?? false;

            return EventSummaryResponseDto.toDtoFrom(eventEntity, isBooked, associatedCategory);
        });

        return new GetAllEventsResponseDto({
            data: eventDtos,
            totalItems: result.totalItems,
            currentPage: result.currentPage,
            itemsPerPage: result.itemsPerPage,
            totalPages: result.totalPages,
        });
    }
}