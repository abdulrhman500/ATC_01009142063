export default class UserNamingException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserNamingException";
    }
}