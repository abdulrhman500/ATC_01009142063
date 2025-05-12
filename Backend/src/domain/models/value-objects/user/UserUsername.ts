import UsernameException from '../../../../shared/exceptions/UsernameException';

export default class UserUsername {
    private static readonly USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;
    private static readonly MIN_LENGTH = 3;
    private static readonly MAX_LENGTH = 30;

    private username: string;

    constructor(username: string) {
        this.username = this.validateUsername(username);
    }

    private validateUsername(username: string): string {
        if (username.length < UserUsername.MIN_LENGTH || username.length > UserUsername.MAX_LENGTH) {
            throw new UsernameException(`Username must be between ${UserUsername.MIN_LENGTH} and ${UserUsername.MAX_LENGTH} characters long.`);
        }
        if (!UserUsername.USERNAME_REGEX.test(username)) {
            throw new UsernameException('Username can only contain letters, numbers, dots, underscores, and hyphens.');
        }
        return username;
    }

    public getUsername(): string {
        return this.username;
    }
}