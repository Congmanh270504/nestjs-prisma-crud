import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { generateRandomCode } from '../helper';

@Injectable()
export class GroupsService {
    constructor(
        private prisma: PrismaService,
        private pusher: PusherService,
    ) {}

    async findAll(filter?: { ownerId?: string; clerkId?: string }) {
        let where: any = undefined;

        if (filter?.ownerId) {
            where = { ownerId: filter.ownerId };
        } else if (filter?.clerkId) {
            const user = await this.prisma.user.findUnique({
                where: { clerkId: filter.clerkId },
            });
            if (!user) {
                return [];
            }
            where = {
                OR: [
                    { ownerId: user.id },
                    {
                        invitations: {
                            some: {
                                userReceivedId: user.id,
                                status: 'ACCEPTED',
                            },
                        },
                    },
                ],
            };
        }

        return this.prisma.groups.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                invitations: {
                    include: {
                        userReceived: {
                            select: {
                                id: true,
                                clerkId: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                _count: {
                    select: {
                        invitations: {
                            where: { status: 'ACCEPTED' },
                        },
                    },
                },
            },
        });
    }

    async findOne(id: string) {
        const group = await this.prisma.groups.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { invitations: true },
                },
                invitations: true,
            },
        });

        if (!group) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        return group;
    }

    async create(dto: CreateGroupDto) {
        let ownerId = dto.ownerId;

        if (!ownerId && dto.clerkId) {
            const user = await this.prisma.user.upsert({
                where: { clerkId: dto.clerkId },
                update: {},
                create: { clerkId: dto.clerkId },
            });
            ownerId = user.id;
        }

        if (!ownerId) {
            throw new BadRequestException(
                'ownerId or clerkId is required to create a group',
            );
        }

        const newGroup = await this.prisma.groups.create({
            data: {
                name: dto.name,
                color: dto.color || 'gray',
                ownerId,
                invitations: {
                    create: {
                        userSentId: ownerId,
                        status: 'ACCEPTED',
                        userReceivedId: ownerId,
                        code: generateRandomCode(6),
                    },
                },
            },
            include: {
                _count: {
                    select: { invitations: true },
                },
            },
        });

        await this.pusher.trigger('groups-channel', 'group-created', newGroup);

        return newGroup;
    }

    async update(id: string, dto: UpdateGroupDto) {
        const group = await this.prisma.groups.findUnique({ where: { id } });
        if (!group) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        const updated = await this.prisma.groups.update({
            where: { id },
            data: {
                name: dto.name,
                color: dto.color,
            },
            include: {
                _count: {
                    select: { invitations: true },
                },
            },
        });

        await this.pusher.trigger('groups-channel', 'group-updated', updated);

        return updated;
    }

    async remove(id: string) {
        const group = await this.prisma.groups.findUnique({ where: { id } });
        if (!group) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        const deleted = await this.prisma.groups.delete({
            where: { id },
        });

        await this.pusher.trigger('groups-channel', 'group-deleted', deleted);

        return deleted;
    }
}
