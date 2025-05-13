export default class UserAlreadyExistException extends Error {
    constructor(message: string = "User with provided email or username already exists.") {
        super(message);
        this.name = "UserAlreadyExistException";
    }
}