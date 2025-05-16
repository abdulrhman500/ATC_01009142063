import { Type } from "class-transformer";

export default class CategoryName {
    
    @Type(() => String)
    private _name: string;

    MAX_LENGTH: number = 30;
    MIN_LENGTH: number = 1;
    constructor(name: string) {
        this.validate(name);
        this._name = name;
    }
    private validate(name: string): void {
        // if (name.length < this.MIN_LENGTH || name.length > this.MAX_LENGTH) {
        //     throw new Error(`Category name must be between ${this.MIN_LENGTH} and ${this.MAX_LENGTH} characters`);
        // }
    }

    public getValue(): string {
        return this._name;
    }
    toJSON() {
        return this._name;
    }

}