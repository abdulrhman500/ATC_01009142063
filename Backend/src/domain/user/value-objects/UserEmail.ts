import EmailException from "@shared/exceptions/EmailException";

export default class UserEmail {

    public equals(newEmail: UserEmail): boolean {
        if (!newEmail) return false;
        return this.email.toLowerCase() === newEmail.getValue().toLowerCase();
    }

    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    private static readonly MAX_LENGTH = 255;

    private email: string;

    constructor(email: string) {
        this.email = this.validateEmail(email);
    }

    private validateEmail(email: string): string {
        if (email.length > UserEmail.MAX_LENGTH) {
            throw new EmailException(`Email must be less than ${UserEmail.MAX_LENGTH} characters long.`);
        }
        if (!UserEmail.EMAIL_REGEX.test(email)) {
            throw new EmailException('Invalid email format.');
        }
        return email;
    }

    public getValue(): string {
        return this.email;
    }

}