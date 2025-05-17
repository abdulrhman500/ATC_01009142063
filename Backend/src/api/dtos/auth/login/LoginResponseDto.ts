import { Expose, Type } from 'class-transformer';
import User from '@domain/user/User';
import MappableResponseDto from '@api/shared/MappableResponseDto'; // Your base DTO
import { RoleType } from '@src/shared/RoleType';
import { LoginResult } from '@application/user/use-cases/LoginUserHandler'; // Assuming LoginResult is { user: User, accessToken: string, expiresIn: number }

// Inner DTO for user details (as previously defined)
class UserLoginDetailsDto {
    @Expose() id!: string;
    @Expose() username!: string;
    @Expose() email!: string;
    @Expose() firstName!: string;
    @Expose() middleName?: string;
    @Expose() lastName!: string;
    @Expose() role!: RoleType;

    constructor(user: User) {
        const nameVO = user.getName();
        this.id = user.getId()!.getValue().toString();
        this.username = user.getUsername().getValue();
        this.email = user.getEmail().getValue();
        this.firstName = nameVO.getFirstName();
        this.middleName = nameVO.getMiddleName() || undefined; // Handle if middleName can be absent from VO
        this.lastName = nameVO.getLastName();
        this.role = user.getRole().getValue();
    }
}

export default class LoginResponseDto extends MappableResponseDto {
    @Expose()
    @Type(() => UserLoginDetailsDto)
    user!: UserLoginDetailsDto;

    @Expose()
    accessToken!: string;

    @Expose()
    tokenType: string = 'Bearer';

    @Expose()
    expiresIn!: number; // In seconds

    // Private constructor to enforce usage of the static factory method
    private constructor(data: Partial<LoginResponseDto>) {
        super(); // Call base MappableResponseDto constructor if it has one
        Object.assign(this, data);
    }

    /**
     * Overrides the method from MappableResponseDto.
     * Creates a LoginResponseDto from the authentication result (user entity and token info).
     */
    public static toDtoFrom(authResult: LoginResult): LoginResponseDto {
        return new LoginResponseDto({
            user: new UserLoginDetailsDto(authResult.user),
            accessToken: authResult.accessToken,
            expiresIn: authResult.expiresIn,
        });
    }
}