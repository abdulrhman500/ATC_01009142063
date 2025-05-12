export default class EventPrice {
    private readonly _price: number;

    constructor(price: number) {
        this.validatePrice(price);
        this._price = price;
    }

    private validatePrice(price: number): void {
        if (isNaN(price) || price < 0) {
            throw new Error('Invalid price. Price must be a non-negative number.');
        }
    }

    get price(): number {
        return this._price;
    }

    toString(): string {
        return this._price.toFixed(2); // Format as needed
    }
}