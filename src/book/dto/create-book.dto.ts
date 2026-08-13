import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBookDto {
  @IsNotEmpty({ message: 'Title không được để trống' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
