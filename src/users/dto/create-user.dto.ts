import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  clerkId: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
