import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
    constructor(
        private prisma: PrismaService,
        private pusher: PusherService,
    ) {}

    async findAll(params: {
        startDate?: string;
        endDate?: string;
        userId?: string;
        groupId?: string;
    }) {
        const { startDate, endDate, userId, groupId } = params;

        const where: any = {};

        if (userId && userId !== 'all') {
            where.OR = [{ creatorId: userId }, { assigneeId: userId }];
        }

        if (groupId) {
            where.groupId = groupId;
        }

        if (startDate && endDate) {
            where.AND = [
                { startDate: { gte: new Date(startDate) } },
                { endDate: { lte: new Date(endDate) } },
            ];
        }

        const tasks = await this.prisma.taskEvent.findMany({
            where,
            include: {
                creator: { select: { id: true, clerkId: true } },
                assignee: { select: { id: true, clerkId: true } },
                group: { select: { id: true, name: true, color: true } },
            },
            orderBy: { startDate: 'asc' },
        });

        // Map to frontend-friendly IEvent format
        return tasks.map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            startDate: task.startDate.toISOString(),
            endDate: task.endDate.toISOString(),
            color: task.color,
            status: task.status,
            priority: task.priority,
            user: {
                id: task.creator.id,
                clerkId: task.creator.clerkId,
            },
            groupId: task.groupId,
            group: task.group,
        }));
    }

    async findOne(id: string) {
        const task = await this.prisma.taskEvent.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, clerkId: true } },
                assignee: { select: { id: true, clerkId: true } },
                group: { select: { id: true, name: true, color: true } },
            },
        });

        if (!task) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        return {
            id: task.id,
            title: task.title,
            description: task.description || '',
            startDate: task.startDate.toISOString(),
            endDate: task.endDate.toISOString(),
            color: task.color,
            status: task.status,
            priority: task.priority,
            user: {
                id: task.creator.id,
                clerkId: task.creator.clerkId,
            },
            groupId: task.groupId,
            group: task.group,
        };
    }

    async create(dto: CreateEventDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${dto.userId} not found`);
        }

        let groupId = dto.groupId;
        if (!groupId) {
            const firstGroup = await this.prisma.groups.findFirst();
            if (!firstGroup) {
                const newGroup = await this.prisma.groups.create({
                    data: {
                        name: 'Default Group',
                        ownerId: user.id,
                        color: 'blue',
                    },
                });
                groupId = newGroup.id;
            } else {
                groupId = firstGroup.id;
            }
        }

        const task = await this.prisma.taskEvent.create({
            data: {
                title: dto.title,
                description: dto.description,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                color: dto.color,
                creatorId: dto.userId,
                groupId,
                status: dto.status || 'TODO',
                priority: dto.priority || 'MEDIUM',
            },
            include: {
                creator: { select: { id: true, clerkId: true } },
                assignee: { select: { id: true, clerkId: true } },
                group: { select: { id: true, name: true, color: true } },
            },
        });

        const formatted = {
            id: task.id,
            title: task.title,
            description: task.description || '',
            startDate: task.startDate.toISOString(),
            endDate: task.endDate.toISOString(),
            color: task.color,
            status: task.status,
            priority: task.priority,
            user: {
                id: task.creator.id,
                clerkId: task.creator.clerkId,
            },
            groupId: task.groupId,
            group: task.group,
        };

        await this.pusher.trigger('events-channel', 'event-created', formatted);

        return formatted;
    }

    async update(id: string, dto: UpdateEventDto) {
        const data: any = {};
        if (dto.title !== undefined) data.title = dto.title;
        if (dto.description !== undefined) data.description = dto.description;
        if (dto.startDate !== undefined)
            data.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
        if (dto.color !== undefined) data.color = dto.color;
        if (dto.userId !== undefined) data.creatorId = dto.userId;
        if (dto.groupId !== undefined) data.groupId = dto.groupId;
        if (dto.status !== undefined) data.status = dto.status;
        if (dto.priority !== undefined) data.priority = dto.priority;

        const task = await this.prisma.taskEvent.update({
            where: { id },
            data,
            include: {
                creator: { select: { id: true, clerkId: true } },
                assignee: { select: { id: true, clerkId: true } },
                group: { select: { id: true, name: true, color: true } },
            },
        });

        const formatted = {
            id: task.id,
            title: task.title,
            description: task.description || '',
            startDate: task.startDate.toISOString(),
            endDate: task.endDate.toISOString(),
            color: task.color,
            status: task.status,
            priority: task.priority,
            user: {
                id: task.creator.id,
                clerkId: task.creator.clerkId,
            },
            groupId: task.groupId,
            group: task.group,
        };

        await this.pusher.trigger('events-channel', 'event-updated', formatted);

        return formatted;
    }

    async remove(id: string) {
        const task = await this.prisma.taskEvent.findUnique({
            where: { id },
            select: { id: true, groupId: true },
        });

        const deleted = await this.prisma.taskEvent.delete({
            where: { id },
        });

        if (task) {
            await this.pusher.trigger('events-channel', 'event-deleted', {
                id: task.id,
                groupId: task.groupId,
            });
        }

        return deleted;
    }
}
