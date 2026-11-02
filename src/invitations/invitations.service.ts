import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { generateRandomCode } from 'src/helper';
import { InvitationStatus } from '@prisma/client';
import { PusherService } from '../pusher/pusher.service';

@Injectable()
export class InvitationsService {
    constructor(private prisma: PrismaService, private pusher: PusherService) {}

    async create(dto: CreateInvitationDto) {
        const groupId = dto.groupId;

        console.log(groupId);

        if (!groupId) {
            throw new BadRequestException('Group ID is required');
        }

        let userSentId = dto.userSentId;
        if (userSentId) {
            const user = await this.prisma.user.findFirst({
                where: {
                    OR: [{ id: userSentId }, { clerkId: userSentId }],
                },
            });

            if (!user && userSentId.startsWith('user_')) {
                throw new BadRequestException('User sent ID is required');
            }

            if (user) {
                userSentId = user.id;
            }
        }

        let userReceivedId = dto.userReceivedId;
        if (userReceivedId) {
            const user = await this.prisma.user.findFirst({
                where: {
                    OR: [{ id: userReceivedId }, { clerkId: userReceivedId }],
                },
            });

            if (!user && userReceivedId.startsWith('user_')) {
                throw new BadRequestException('User received ID is required');
            }

            if (user) {
                userReceivedId = user.id;
            }
        }

        const invitation = await this.prisma.invitations.create({
            data: {
                code: generateRandomCode(dto.code),
                groupId,
                userSentId,
                userReceivedId,
                des: dto.des || 'Invitation request sent via Invitation Dialog',
            },
            include: {
                group: true,
                userSent: true,
                userReceived: true,
            },
        });

        await this.pusher.trigger(
            'invitations-channel',
            'invitation-received',
            invitation,
        );

        return invitation;
    }

    async findAll(filter?: { status?: InvitationStatus; clerkId?: string }) {
        console.log(filter?.clerkId);
        const where: any = {};
        if (filter?.status) {
            where.status = filter.status;
        }

        if (filter?.clerkId) {
            where.userReceived = {
                clerkId: filter.clerkId,
            };
            where.NOT = {
                userSent: {
                    clerkId: filter.clerkId,
                },
            };
        }

        return this.prisma.invitations.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                group: true,
                userSent: true,
                userReceived: true,
            },
        });
    }

    async updateStatus(id: string, status: InvitationStatus) {
        const updated = await this.prisma.invitations.update({
            where: { id },
            data: { status },
            include: {
                group: true,
                userSent: true,
                userReceived: true,
            },
        });

        if (status === 'REJECTED') {
            const deleted = await this.prisma.invitations.delete({
                where: { id },
            });

            await this.pusher.trigger(
                'invitations-channel',
                'invitation-deleted',
                deleted,
            );

            return deleted;
        }

        await this.pusher.trigger(
            'invitations-channel',
            'invitation-updated',
            updated,
        );

        return updated;
    }

    async findOne(id: string) {
        return this.prisma.invitations.findUnique({
            where: { id },
            include: {
                group: true,
                userSent: true,
                userReceived: true,
            },
        });
    }

    async delete(id: string) {
        const deleted = await this.prisma.invitations.delete({
            where: { id },
        });

        await this.pusher.trigger(
            'invitations-channel',
            'invitation-deleted',
            deleted,
        );

        return deleted;
    }
}
