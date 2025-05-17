export default class PasswordException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PasswordException";
        Object.setPrototypeOf(this, PasswordException.prototype); // Needed for custom Error subclassing
    }
}
