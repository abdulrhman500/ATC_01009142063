import UserNamingException from '../../../../shared/exceptions/UserNamingException';

export default class UserName {

    private static readonly MIN_LENGTH = 2;
    private static readonly MAX_LENGTH = 100;

    private first: string;
    private middle: string;
    private last: string;

    constructor(first: string, middle: string, last: string) {
        this.first = this.validateName(first);
        this.middle = this.validateName(middle);
        this.last = this.validateName(last);
    }

    validateName(name: string): string {
        if (name.length < UserName.MIN_LENGTH || name.length > UserName.MAX_LENGTH) {
            throw new UserNamingException(`Name must be between ${UserName.MIN_LENGTH} and ${UserName.MAX_LENGTH} characters long.`);
        }
        if (!/^[a-zA-Z]+$/.test(name)) {
            throw new UserNamingException('Name can only contain letters.');
        }
        return name;
    }
    public getFirst(): string {
        return this.first;
    }
    public getMiddle(): string {
        return this.middle;
    }
    public getLast(): string {
        return this.last;
    }
    public getFullName(): string {
        return `${this.first} ${this.middle} ${this.last}`;
    }
    public getInitials(): string {
        return `${this.first.charAt(0)}${this.middle.charAt(0)}${this.last.charAt(0)}`;
    }
}