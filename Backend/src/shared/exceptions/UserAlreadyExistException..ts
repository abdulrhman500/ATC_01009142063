class UserAlreadyExistException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserAlreadyExistException";
    }
}
export default UserAlreadyExistException;