export default class RegisterUserCommand {
    constructor(
        public readonly firstName: string,
        public readonly middleName: string,
        public readonly lastName: string,
        public readonly username: string,
        public readonly email: string,
        public readonly password: string
    ) {}
}