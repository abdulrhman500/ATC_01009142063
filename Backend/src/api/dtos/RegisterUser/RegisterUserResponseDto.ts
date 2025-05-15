// src/api/dtos/RegisterUser/RegisterUserResponseDto.ts
import { Expose, Transform } from 'class-transformer';
import User  from '@domain/user/User'; // Import the source User class if needed for typing transforms

export class RegisterUserResponseDto {

  @Expose() // Mark this property to be exposed in the output
  @Transform(({ obj }: { obj: User }) => obj.getId()?.getValue()) // Use transform to get the value from the User object
  id!: string; // Use '!' as it will be assigned by class-transformer

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.getUsername().getValue())
  username!: string;

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.getEmail().getValue())
  email!: string;

}