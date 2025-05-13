
const MAX_DESCRIPTION_LENGTH = 1000;

export default class EventDescription {
    public readonly value: string;

    constructor(value: string | null | undefined) {
        // Description can potentially be empty or null, depending on business rules
        const description = value ? value.trim() : '';

        if (description.length > MAX_DESCRIPTION_LENGTH) {
            throw new Error(`Event description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`);
        }
        this.value = description;
    }

    equals(other: EventDescription): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}