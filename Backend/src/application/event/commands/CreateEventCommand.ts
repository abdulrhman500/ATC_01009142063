import UserId from "@domain/user/value-objects/UserId";

export class CreateEventCommand {
    constructor(
        public readonly name: string,
        public readonly description: string,
        public readonly date: Date, // Note: Converted from string in handler/controller
        public readonly venueId: number,
        public readonly priceValue: number,
        public readonly priceCurrency: string,
        public readonly photoUrl: string|undefined,
        public readonly categoryId?: number | null
    ) {}
}