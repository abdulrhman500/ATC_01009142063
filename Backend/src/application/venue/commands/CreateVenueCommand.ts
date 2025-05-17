export class CreateVenueCommand {
    constructor(
        public readonly name: string,
        public readonly street: string,
        public readonly city: string,
        public readonly country: string,
        public readonly state?: string,
        public readonly postalCode?: string,
        public readonly placeUrl?: string
        // No creatorId as per user preference for events, assuming same for venues for simplicity
    ) {}
}