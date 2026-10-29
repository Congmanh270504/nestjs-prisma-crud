import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReminderChannel } from '@prisma/client';

export class CreateReminderDto {
  @IsString()
  @IsNotEmpty()
  taskEventId: string;

  @IsDateString()
  @IsNotEmpty()
  remindAt: string;

  @IsEnum(ReminderChannel)
  @IsOptional()
  channel?: ReminderChannel;
}
