import { Expose } from 'class-transformer';
import { IsString, IsEmail, MinLength, MaxLength, Matches, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { RoleType } from '@src/shared/RoleType';
export default class RegisterUserRequestDto {
    @Expose()
    @IsNotEmpty({ message: 'First name is required.' })
    @IsString()
    @MinLength(2, { message: 'First name must be at least 2 characters long.' })
    @MaxLength(50, { message: 'First name cannot be longer than 50 characters.' })
    firstName!: string;

    @Expose()
    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Last name must be at least 2 characters long.' })
    @MaxLength(50, { message: 'Last name cannot be longer than 50 characters.' })
    middleName!: string;
    
    @Expose()
    @IsNotEmpty({ message: 'Last name is required.' })
    @IsString()
    @MinLength(2, { message: 'Last name must be at least 2 characters long.' })
    @MaxLength(50, { message: 'Last name cannot be longer than 50 characters.' })
    lastName!: string;



    @Expose()
    @IsNotEmpty({ message: 'Username is required.' })
    @IsString()
    @MinLength(3, { message: 'Username must be at least 3 characters long.' })
    @MaxLength(30, { message: 'Username cannot be longer than 30 characters.' })
    @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores.' })
    username!: string;

    @Expose()
    @IsNotEmpty({ message: 'Email is required.' })
    @IsEmail({}, { message: 'Please provide a valid email address.' })
    @MaxLength(255, { message: 'Email cannot be longer than 255 characters.' })
    email!: string;

    @Expose()
    @IsNotEmpty({ message: 'Password is required.' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    @MaxLength(100, { message: 'Password cannot be longer than 100 characters.' })
    password!: string;

    @Expose()
    @IsOptional() // Role should be optional for a public registration form
    @IsEnum(RoleType, { message: `Role must be one of the following: ${Object.values(RoleType).join(', ')}`})
    role!: string; 
}