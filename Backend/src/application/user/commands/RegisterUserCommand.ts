// @application/user/commands/RegisterUserCommand.ts
// This is an Application Layer DTO, possibly mapped from the API Layer's DTO
export class RegisterUserCommand {
    constructor(
        public readonly firstName: string,
        public readonly middleName: string | undefined, // Match DTO can be undefined
        public readonly lastName: string,
        public readonly email: string,
        public readonly username: string,
        public readonly password: string // Application layer might handle password directly or pass to domain service
    ) {}
}