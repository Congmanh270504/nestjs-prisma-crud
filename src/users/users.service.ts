import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(private prisma: PrismaService) {}

    async onModuleInit() {
        // await this.seedInitialUsers();
    }

    async findAll(limit = 20) {
        return this.prisma.user.findMany({
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
                projects: true,
                createdTasks: { take: 5, orderBy: { startDate: 'desc' } },
            },
        });
    }

    async create(dto: CreateUserDto) {
        return this.prisma.user.create({
            data: dto,
        });
    }

    async sync(clerkId: string) {
        return this.prisma.user.upsert({
            where: { clerkId },
            update: {},
            create: {
                clerkId,
            },
        });
    }
}
