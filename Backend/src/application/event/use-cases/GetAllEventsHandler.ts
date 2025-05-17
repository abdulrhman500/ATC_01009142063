import { GetAllEventsQuery } from "@application/event/quries/GetAllEventsQuery"; // Corrected 'queries' path
import { TYPES } from "@src/config/types";
import ICategoryRepository from "@src/domain/category/interfaces/ICategoryRepository";
import IEventRepository from "@src/domain/event/interfaces/IEventRepository";
import { injectable, inject } from "inversify";
import DomainEvent from '@domain/event/Event'; // Assuming Event is aliased as DomainEvent
import Category from '@src/domain/category/Category';
import { IBookingRepository } from "@src/domain/booking/interfaces/IBookingRepository"; // Import IBookingRepository
import { RoleType } from "@src/shared/RoleType"; // Import RoleType

/**
 * Represents the structured result returned by the GetAllEventsHandler,
 * containing a paginated list of domain Event entities and pagination metadata.
 */
export interface PaginatedEventsHandlerResult {
    events: DomainEvent[];
    categoriesMap?: Map<number, Category>;         // For mapping category names in DTO
    bookedEventIdsForCurrentUser?: Set<number>; // For the isBooked flag in DTO
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
}

@injectable()
export default class GetAllEventsHandler {

    public constructor(
        @inject(TYPES.IEventRepository) private readonly eventRepository: IEventRepository,
        @inject(TYPES.ICategoryRepository) private readonly categoryRepository: ICategoryRepository,
        @inject(TYPES.IBookingRepository) private readonly bookingRepository: IBookingRepository // Inject BookingRepository
    ) { }

    public async execute(query: GetAllEventsQuery): Promise<PaginatedEventsHandlerResult> {
        const { page, limit, textSearch, directCategoryIds, categoryNames, currentUserId, currentUserRole } = query;

        let categoryIdsToFilter: number[] = [];

        if (directCategoryIds && directCategoryIds.length > 0) {
            categoryIdsToFilter.push(...directCategoryIds);
        }

        if (categoryNames && categoryNames.length > 0) {
            const categoriesFoundByName = await this.categoryRepository.findByNames(categoryNames);
            // Assuming Category.getId() returns number | null
            const idsFromNames = categoriesFoundByName
                .map(c => c.getId())
                .filter((id): id is number => id !== null); // Ensure only non-null numbers
            categoryIdsToFilter.push(...idsFromNames);
        }

        // Get unique IDs and then find all descendants (including themselves)
        if (categoryIdsToFilter.length > 0) {
            const uniqueInitialIds = Array.from(new Set(categoryIdsToFilter));
            categoryIdsToFilter = await this.categoryRepository.findAllDescendantIds(uniqueInitialIds);
        }

        const { events, totalCount } = await this.eventRepository.findPaginated({
            page,
            limit,
            textSearch,
            categoryIds: categoryIdsToFilter.length > 0 ? categoryIdsToFilter : undefined,
        });

        // --- Logic to fetch bookedEventIdsForCurrentUser ---
        let bookedEventIdsForCurrentUser: Set<number> | undefined = undefined;
        if (currentUserId && currentUserRole === RoleType.CUSTOMER && events.length > 0) {
            const eventDomainEntityIds = events.map(event => event.id); // Assuming event.id is number
            if (eventDomainEntityIds.length > 0) {
                bookedEventIdsForCurrentUser = await this.bookingRepository.findUserBookedEventIds(currentUserId, eventDomainEntityIds);
            }
        }

        // --- Logic to fetch categoriesMap for category names ---
        let categoriesMap: Map<number, Category> | undefined = undefined;
        const relevantCategoryIdsFromEvents = new Set<number>();
        events.forEach(event => {
            const catId = event.getCategoryId?.(); // Assuming Event domain entity has getCategoryId(): number | null | undefined
            if (catId != null) { // Check for null or undefined
                relevantCategoryIdsFromEvents.add(catId);
            }
        });

        if (relevantCategoryIdsFromEvents.size > 0) {
            const fetchedCategories = await this.categoryRepository.findByIds(Array.from(relevantCategoryIdsFromEvents));
            categoriesMap = new Map<number, Category>();
            fetchedCategories.forEach(cat => {
                const catId = cat.getId();
                if (catId != null) { // Ensure ID is not null before setting in map
                    categoriesMap!.set(catId, cat);
                }
            });
        }
        // --- End of added logic ---

        const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 0;

        // Ensure page, limit, totalCount are numbers before returning
        // The `Number()` casts might be redundant if these are already numbers from the query/repo.
        return {
            events: events, // Removed `as unknown as DomainEvent[]` - aim for correct typing from repository
            totalItems: Number(totalCount),
            currentPage: Number(page),
            itemsPerPage: Number(limit),
            totalPages: totalPages,
            categoriesMap: categoriesMap,                 // Include in return
            bookedEventIdsForCurrentUser: bookedEventIdsForCurrentUser, // Include in return
        };
    }
}