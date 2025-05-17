import Event from '@domain/event/Event'; // Your domain Event
import { Prisma } from '@prisma/client'; // For complex query types if needed

export interface FindEventsPaginatedParams {
    page: number;
    limit: number;
    textSearch?: string;
    categoryIds?: number[];
    // Add other filter params like date ranges, venueId, tags etc. as needed in the future
}

export interface PaginatedEventsResult {
    events: Event[];
    totalCount: number;
}

export default interface IEventRepository {
    // Method from your context
    reassignEventsCategory(oldCategoryId: number, newCategoryId: number): Promise<void>;

    // New method for fetching events with filters and pagination
    findPaginated(params: FindEventsPaginatedParams): Promise<PaginatedEventsResult>;

    findById(id: number): Promise<Event | null>;
    // Add create, update, delete methods as you build those endpoints
    // save(event: Event): Promise<Event>;
    // delete(id: number): Promise<boolean>;
}