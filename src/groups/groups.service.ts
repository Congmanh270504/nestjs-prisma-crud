import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { generateRandomCode } from '../helper';

@Injectable()
export class GroupsService {
    constructor(private prisma: PrismaService) {}

    async findAll(filter?: { ownerId?: string; clerkId?: string }) {
        let ownerId = filter?.ownerId;

        if (!ownerId && filter?.clerkId) {
            const user = await this.prisma.user.findUnique({
                where: { clerkId: filter.clerkId },
            });
            if (!user) {
                return [];
            }
            ownerId = user.id;
        }

        return this.prisma.groups.findMany({
            where: ownerId ? { ownerId } : undefined,
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
                    orderBy: { createdAt: 'desc' },
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

        return this.prisma.groups.create({
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
    }

    async update(id: string, dto: UpdateGroupDto) {
        const group = await this.prisma.groups.findUnique({ where: { id } });
        if (!group) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        return this.prisma.groups.update({
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
    }

    async remove(id: string) {
        const group = await this.prisma.groups.findUnique({ where: { id } });
        if (!group) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        return this.prisma.groups.delete({
            where: { id },
        });
    }
}
