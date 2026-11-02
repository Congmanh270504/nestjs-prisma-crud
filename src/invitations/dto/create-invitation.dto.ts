import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInvitationDto {
    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsNotEmpty()
    groupId: string;

    @IsString()
    @IsOptional()
    userSentId?: string;

    @IsString()
    @IsOptional()
    userReceivedId?: string;

    @IsString()
    @IsOptional()
    des?: string;
}

