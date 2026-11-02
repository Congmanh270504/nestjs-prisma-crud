import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Query,
    Patch,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationStatus } from '@prisma/client';

@Controller('invitations')
export class InvitationsController {
    constructor(private readonly invitationsService: InvitationsService) {}

    @Post()
    create(@Body() dto: CreateInvitationDto) {
        return this.invitationsService.create(dto);
    }

    @Get()
    findAll(
        @Query('status') status?: InvitationStatus,
        @Query('clerkId') clerkId?: string,
    ) {
        return this.invitationsService.findAll({ status, clerkId });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.invitationsService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: InvitationStatus,
    ) {
        return this.invitationsService.updateStatus(id, status);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body('status') status: InvitationStatus,
    ) {
        return this.invitationsService.updateStatus(id, status);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.invitationsService.delete(id);
    }
}
