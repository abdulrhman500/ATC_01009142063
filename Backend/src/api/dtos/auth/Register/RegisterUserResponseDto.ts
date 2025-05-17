import { Expose } from 'class-transformer';
import User from '@domain/user/User';
import MappableResponseDto from '@api/shared/MappableResponseDto'; // Your base class
import { RoleType } from '@src/shared/RoleType';

export default class RegisterUserResponseDto extends MappableResponseDto {
    @Expose()
    id!: string;

    @Expose()
    firstName!: string;

    @Expose()
    middleName!: string;


    @Expose()
    lastName!: string;

    @Expose()
    username!: string;

    @Expose()
    email!: string;

    @Expose()
    role!: string;

    @Expose()
    createdAt!: string; // ISO date string

    // Private constructor to enforce usage of fromEntity
    private constructor(data: Partial<RegisterUserResponseDto>) {
        super();
        Object.assign(this, data);
    }

    public static fromEntity(entity: User): RegisterUserResponseDto {
        return new RegisterUserResponseDto({
            id: entity.getId()?.getValue()?.toString(),
            firstName: entity.getName().getFirstName(),
            middleName: entity.getName().getMiddleName(),
            lastName: entity.getName().getLastName(),
            username: entity.getUsername().getValue(),
            email: entity.getEmail().getValue(),
            role: entity.getRole().getValue().toString(),
            createdAt: entity.getCreatedAt().toISOString(),
        });
    }
}