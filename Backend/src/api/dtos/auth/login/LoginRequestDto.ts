import { Expose } from 'class-transformer';
import { IsString, IsEmail, MinLength, IsNotEmpty, ValidateIf } from 'class-validator';

export default class LoginRequestDto {
    @Expose()
    @ValidateIf(o => !o.username) // Email is required if username is not provided
    @IsNotEmpty({ message: 'Email or username is required.' })
    @IsEmail({}, { message: 'Please provide a valid email address if not logging in with username.' })
    email?: string;

    @Expose()
    @ValidateIf(o => !o.email) // Username is required if email is not provided
    @IsNotEmpty({ message: 'Email or username is required.' })
    @IsString({ message: 'Username must be a string if not logging in with email.' })
    username?: string;

    @Expose()
    @IsNotEmpty({ message: 'Password is required.' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    password!: string;
}