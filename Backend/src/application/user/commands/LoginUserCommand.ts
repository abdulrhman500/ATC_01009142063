export class LoginUserCommand {
    constructor(
        public readonly identifier: string, // This will be email or username
        public readonly password: string
    ) {}
}