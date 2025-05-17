import { Expose, Type } from 'class-transformer';
import MappableResponseDto from '@api/shared/MappableResponseDto';
import EventSummaryResponseDto from '@api/dtos/event/GetAllEvents/EventSummaryResponseDto';
import { PaginatedEventsHandlerResult } from '@application/event/use-cases/GetAllEventsHandler';
// If Event domain entities are passed with their categories, you'll need Category domain entity too
import Category from '@domain/category/Category';
import Event from '@domain/event/Event';


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

    // The source here is the result from the GetAllEventsHandler
    // which includes domain Event entities. The mapping to EventSummaryResponseDto
    // needs to happen here or assumes Event entities might have their category pre-fetched.
    // For simplicity, let's assume Event entities might not have their category directly.
    // The repository returns Events. If we need category name, the handler would fetch it.
    // Or, we can pass events and a map of their categories.
    // For now, let's assume EventSummaryResponseDto.fromEntity handles what it needs.
    // If category is needed, the handler should provide it or EventSummaryResponseDto should fetch it (less ideal).

    public static fromPaginatedResult(
        result: PaginatedEventsHandlerResult,
        // Optional: A way to get category for each event if needed by EventSummaryResponseDto.fromEntity
        // categoryMap?: Map<number, Category> // categoryId -> Category entity
    ): GetAllEventsResponseDto {
        const eventDtos = result.events.map(eventEntity => {
            // If EventSummaryResponseDto needs associated category to display name:
            // const category = eventEntity.categoryId ? categoryMap?.get(eventEntity.categoryId) : undefined;
            // return EventSummaryResponseDto.fromEntity(eventEntity, category);
            return EventSummaryResponseDto.toDtoFrom(eventEntity as unknown as Event); // Type assertion to match expected Event domain type
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