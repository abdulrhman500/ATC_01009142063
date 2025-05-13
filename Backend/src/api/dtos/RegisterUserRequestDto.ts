// @api/dtos/RegisterUserRequestDto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer'; // Needed for validation pipes/middleware

/**
 * Data Transfer Object for user registration requests (as a class for validation).
 */
export class RegisterUserDtoRequest {
    @IsNotEmpty({ message: "Email is required" })
    @IsEmail({}, { message: "Invalid email format" })
    email!: string;

    @IsNotEmpty({ message: "Password is required" })
    @MinLength(8, { message: "Password must be at least 8 characters long" }) // Example validation rule
    password!: string;

    @IsNotEmpty({ message: "Username is required" })
    @IsString()
    username!: string;

    @IsNotEmpty({ message: "First name is required" })
    @IsString()
    firstName!: string;

    @IsOptional() // Middle name is optional
    @IsString()
    // @Transform(({ value }) => value ?? '') // Optional: Use if you strictly need '' instead of undefined/null when not provided
    middleName?: string; // Use `?` to indicate it's optional in TypeScript

    @IsNotEmpty({ message: "Last name is required" })
    @IsString()
    lastName!: string;
}