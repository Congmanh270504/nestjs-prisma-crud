import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { generateRandomCode } from '../helper';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(private prisma: PrismaService) {}

    async onModuleInit() {
        // await this.seedInitialUsers();
    }

    async findAll(limit = 20, groupId?: string, excludeGroupId?: string) {
        const where: any = {};
        if (groupId) {
            where.OR = [
                { groups: { some: { id: groupId } } },
                { receivedInvitations: { some: { groupId } } },
                { sentInvitations: { some: { groupId } } },
            ];
        }
        if (excludeGroupId) {
            where.NOT = {
                OR: [
                    {
                        receivedInvitations: {
                            some: { groupId: excludeGroupId },
                        },
                    },
                    {
                        sentInvitations: {
                            some: { groupId: excludeGroupId },
                        },
                    },
                    {
                        groups: {
                            some: { id: excludeGroupId },
                        },
                    },
                ],
            };
        }

        return this.prisma.user.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                clerkId: true,
                role: true,
                createdAt: true,
            },
        });
    }

    async findOne(idOrClerkId: string) {
        return this.prisma.user.findFirst({
            where: {
                OR: [{ id: idOrClerkId }, { clerkId: idOrClerkId }],
            },
            include: {
                groups: true,
                createdTasks: { take: 5, orderBy: { startDate: 'desc' } },
            },
        });
    }

    private async createDefaultSampleGroups(
        tx: Prisma.TransactionClient,
        userId: string,
    ) {
        const sampleGroups = [
            { name: 'Group 1', color: 'blue' },
            { name: 'Group 2', color: 'green' },
        ];

        for (const group of sampleGroups) {
            await tx.groups.create({
                data: {
                    name: group.name,
                    color: group.color,
                    ownerId: userId,
                    invitations: {
                        create: {
                            userSentId: userId,
                            userReceivedId: userId,
                            status: 'ACCEPTED',
                            code: generateRandomCode(6),
                        },
                    },
                },
            });
        }
    }

    async create(dto: CreateUserDto) {
        return this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: dto,
            });

            await this.createDefaultSampleGroups(tx, newUser.id);

            return newUser;
        });
    }

    async sync(clerkId: string) {
        const existingUser = await this.prisma.user.findUnique({
            where: { clerkId },
        });

        if (existingUser) {
            return existingUser;
        }

        return this.prisma.$transaction(async (tx) => {
            const userInTx = await tx.user.findUnique({
                where: { clerkId },
            });
            if (userInTx) {
                return userInTx;
            }

            const newUser = await tx.user.create({
                data: {
                    clerkId,
                },
            });

            await this.createDefaultSampleGroups(tx, newUser.id);

            return newUser;
        });
    }
}
