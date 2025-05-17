// src/application/event/use-cases/GetAllEventsHandler.ts
// ... (imports)

import { GetAllEventsQuery } from "@application/event/quries/GetAllEventsQuery";
import { TYPES } from "@src/config/types";
import ICategoryRepository from "@src/domain/category/interfaces/ICategoryRepository";
import IEventRepository from "@src/domain/event/interfaces/IEventRepository";
import { injectable ,inject} from "inversify";

/**
 * Represents the structured result returned by the GetAllEventsHandler,
 * containing a paginated list of domain Event entities and pagination metadata.
 */
export interface PaginatedEventsHandlerResult {
    /**
     * An array of Event domain entities for the current page.
     */
    events: Event[];

    /**
     * The total number of event items available across all pages matching the criteria.
     */
    totalItems: number;

    /**
     * The current page number being returned.
     */
    currentPage: number;

    /**
     * The number of items requested per page (the limit).
     */
    itemsPerPage: number;

    /**
     * The total number of pages available based on totalItems and itemsPerPage.
     */
    totalPages: number;
}
@injectable()
export default class GetAllEventsHandler {
    
public constructor(
    @inject(TYPES.IEventRepository) private readonly eventRepository: IEventRepository,
    @inject(TYPES.ICategoryRepository) private readonly categoryRepository: ICategoryRepository,
) { }
public async execute(query: GetAllEventsQuery): Promise<PaginatedEventsHandlerResult> {
    const { page, limit, textSearch, directCategoryIds, categoryNames } = query;

    let categoryIdsToFilter: number[] = [];

    if (directCategoryIds && directCategoryIds.length > 0) {
        categoryIdsToFilter.push(...directCategoryIds);
    }

    if (categoryNames && categoryNames.length > 0) {
        const categoriesFoundByName = await this.categoryRepository.findByNames(categoryNames);
        const idsFromNames = categoriesFoundByName.map(c => c.getId()!).filter((id): id is number => id !== null);
        categoryIdsToFilter.push(...idsFromNames);
    }

    // Get unique IDs and then find all descendants
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

    const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 0;

    return {
        events: events as unknown as Event[],
        totalItems: Number(totalCount),
        currentPage: Number(page),
        itemsPerPage: Number(limit),
        totalPages,
    };
}
}