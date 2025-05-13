export default class EventPrice {
    private readonly _value: number;
    private readonly _currency: string;

    private static readonly MIN_PRICE = 0;
    private static readonly MAX_PRICE = 1000000;

    private static readonly VALID_CURRENCIES = ['EGP', 'USD', 'EUR'];

    /**
     * Constructs an EventPrice Value Object.
     * @param value - The numeric price value.
     * @param currency - The currency code (defaults to 'EGP').
     * @throws Error if price or currency are invalid.
     */
    constructor(value: number, currency: string = 'EGP') {
        // Validate inputs before assigning to readonly properties
        this.validateValue(value);
        this.validateCurrency(currency);

        this._value = value;
        this._currency = currency; 
    }


    private validateValue(value: number): void {
        if (typeof value !== 'number' || isNaN(value) || value < EventPrice.MIN_PRICE || value > EventPrice.MAX_PRICE) {
            throw new Error(`Invalid price value. Price must be a number between ${EventPrice.MIN_PRICE} and ${EventPrice.MAX_PRICE}.`);
        }
        if (value !== parseFloat(value.toFixed(2))) {
            throw new Error("Price value can only have up to two decimal places.");
        }
    }

    private validateCurrency(currency: string): void {
        if (typeof currency !== 'string' || currency.trim() === '') {
            throw new Error("Currency cannot be empty.");
        }
        const upperCurrency = currency.toUpperCase();
        if (!EventPrice.VALID_CURRENCIES.includes(upperCurrency)) {
            throw new Error(`Invalid currency. Currency must be one of the following: ${EventPrice.VALID_CURRENCIES.join(', ')}`);
        }
    }


    public get value(): number {
        return this._value;
    }

    public get currency(): string {
        return this._currency;
    }


    equals(other: EventPrice): boolean {
        // Check for null, undefined, and same type
        if (other === null || other === undefined || this.constructor !== other.constructor) {
            return false;
        }
        // Compare the values and the currencies
        return this._value === other.value && this._currency === other.currency;
    }


    // /**
    //  * Adds another EventPrice to this one.
    //  * Currencies must match. Returns a new EventPrice (immutability).
    //  * @param other - The EventPrice to add.
    //  * @returns A new EventPrice representing the sum.
    //  * @throws Error if currencies do not match.
    //  */
    // add(other: EventPrice): EventPrice {
    //     if (!this.currencyEquals(other)) {
    //         throw new Error(`Cannot add prices with different currencies (${this.currency} vs ${other.currency}).`);
    //     }
    //     // Return a new instance as Value Objects are immutable
    //     return new EventPrice(this._value + other.value, this._currency);
    // }

    // /**
    //  * Subtracts another EventPrice from this one.
    //  * Currencies must match. Returns a new EventPrice (immutability).
    //  * @param other - The EventPrice to subtract.
    //  * @returns A new EventPrice representing the difference.
    //  * @throws Error if currencies do not match.
    //  */
    // subtract(other: EventPrice): EventPrice {
    //     if (!this.currencyEquals(other)) {
    //         throw new Error(`Cannot subtract prices with different currencies (${this.currency} vs ${other.currency}).`);
    //     }
    //      // Return a new instance as Value Objects are immutable
    //     return new EventPrice(this._value - other.value, this._currency);
    // }

    // /**
    //  * Multiplies the price by a factor.
    //  * Returns a new EventPrice (immutability).
    //  * @param factor - The number to multiply by.
    //  * @returns A new EventPrice representing the product.
    //  */
    // multiply(factor: number): EventPrice {
    //      if (typeof factor !== 'number' || isNaN(factor)) {
    //          throw new Error("Factor must be a number.");
    //      }
    //      // Return a new instance as Value Objects are immutable
    //      // Need to handle potential floating point inaccuracies here,
    //      // potentially using a library for currency calculations in a real app.
    //     return new EventPrice(this._value * factor, this._currency);
    // }

    // currencyEquals(other: EventPrice): boolean {
    //     if (other === null || other === undefined) {
    //         return false;
    //     }
    //     return this._currency === other.currency;
    // }



    // toString(): string {
    //     // Use toFixed(2) for standard currency representation
    //     return `${this._value.toFixed(2)} ${this._currency}`;
    // }


}