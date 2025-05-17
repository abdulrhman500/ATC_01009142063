export class GetAllEventsQuery {
    constructor(
        public readonly page: number,
        public readonly limit: number,
        public readonly textSearch?: string,
        public readonly directCategoryIds?: number[], // IDs directly from request
        public readonly categoryNames?: string[]    // Names directly from request
    ) {}
}