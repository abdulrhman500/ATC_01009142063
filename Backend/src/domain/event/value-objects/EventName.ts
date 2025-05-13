// BusinessLogic/ValueObjects/EventName.ts

const MAX_NAME_LENGTH = 100;

export default class EventName {
    // Value Objects are typically defined by their value(s)
    public readonly value: string;

    constructor(value: string) {
        if (!value || value.trim() === '') {
            throw new Error("Event name cannot be empty.");
        }
        if (value.length > MAX_NAME_LENGTH) {
            throw new Error(`Event name cannot exceed ${MAX_NAME_LENGTH} characters.`);
        }
        // Add other name-specific validation (e.g., no special characters)

        this.value = value.trim(); // Store trimmed value
    }

    // Value Objects are compared by value, not identity
    equals(other: EventName): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}