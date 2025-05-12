
export default class EventDate {
    public readonly value: Date;

    constructor(value: Date) {
        if (!(value instanceof Date) || isNaN(value.getTime())) {
             throw new Error("Invalid date format for EventDate.");
        }
        if (value < new Date()) {
            throw new Error("Event date cannot be in the past.");
        }

        this.value = new Date(value.getTime());
    }

    equals(other: EventDate): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return this.value.getTime() === other.value.getTime();
    }

    toString(): string {
        return this.value.toISOString(); // Or format as needed
    }
}