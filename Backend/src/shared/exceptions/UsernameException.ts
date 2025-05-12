export default class UsernameException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UsernameException';
    }
}