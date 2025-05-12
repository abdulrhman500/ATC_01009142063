// BusinessLogic/ValueObjects/EventLocation.ts

const MAX_LOCATION_LENGTH = 200;

export default class EventLocation {
    public readonly value: string;

    constructor(value: string) {
         if (!value || value.trim() === '') {
             throw new Error("Event location cannot be empty.");
         }
         if (value.length > MAX_LOCATION_LENGTH) {
             throw new Error(`Event location cannot exceed ${MAX_LOCATION_LENGTH} characters.`);
         }
         // Add other location-specific validation (e.g., basic format)

         this.value = value.trim();
    }

    equals(other: EventLocation): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}