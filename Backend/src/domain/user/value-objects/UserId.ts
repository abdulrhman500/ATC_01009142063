
export default class UserId {
    private readonly value: number;

    constructor(value: number) {
        if (value == null || !Number.isInteger(value) || value <= 0) {
            throw new Error("Invalid User ID.");
        }
        this.value = value;
    }

    equals(other: UserId): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return this.value === other.value;
    }

    toString(): string {
        return this.value.toString();
    }

    public getValue(): number {
        return this.value;
    }
}