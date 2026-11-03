import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

const TASK_INCLUDE = {
    creator: { select: { id: true, clerkId: true } },
    assignee: { select: { id: true, clerkId: true } },
    group: { select: { id: true, name: true, color: true } },
};

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService, private pusher: PusherService) {}

    private formatTaskEvent(task: any) {
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
                id: task.creator?.id || task.creatorId,
                clerkId: task.creator?.clerkId,
            },
            creatorId: task.creatorId,
            creator: task.creator
                ? {
                      id: task.creator.id,
                      clerkId: task.creator.clerkId,
                  }
                : undefined,
            assigneeId: task.assigneeId,
            assignee: task.assignee
                ? {
                      id: task.assignee.id,
                      clerkId: task.assignee.clerkId,
                  }
                : null,
            groupId: task.groupId,
            group: task.group,
            createdAt: task.createdAt?.toISOString(),
            updatedAt: task.updatedAt?.toISOString(),
        };
    }

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
            include: TASK_INCLUDE,
            orderBy: { startDate: 'asc' },
        });

        return tasks.map((task) => this.formatTaskEvent(task));
    }

    async findOne(id: string) {
        const task = await this.prisma.taskEvent.findUnique({
            where: { id },
            include: TASK_INCLUDE,
        });

        if (!task) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        return this.formatTaskEvent(task);
    }

    async create(dto: CreateEventDto) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [{ id: dto.userId }, { clerkId: dto.userId }],
            },
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

        let assigneeId: string | null = null;
        if (dto.assigneeId && dto.assigneeId !== 'unassigned') {
            const assigneeUser = await this.prisma.user.findFirst({
                where: {
                    OR: [{ id: dto.assigneeId }, { clerkId: dto.assigneeId }],
                },
            });
            if (assigneeUser) {
                assigneeId = assigneeUser.id;
            }
        }

        const data: any = {
            title: dto.title,
            description: dto.description,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
            color: dto.color,
            creatorId: user.id,
            assigneeId,
            groupId,
            status: dto.status || 'TODO',
            priority: dto.priority || 'MEDIUM',
        };

        const task = await this.prisma.taskEvent.create({
            data,
            include: TASK_INCLUDE,
        });

        const formatted = this.formatTaskEvent(task);

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
        if (dto.userId !== undefined) {
            const user = await this.prisma.user.findFirst({
                where: {
                    OR: [{ id: dto.userId }, { clerkId: dto.userId }],
                },
            });
            if (user) {
                data.creatorId = user.id;
            }
        }
        if (dto.assigneeId !== undefined) {
            if (dto.assigneeId && dto.assigneeId !== 'unassigned') {
                const assigneeUser = await this.prisma.user.findFirst({
                    where: {
                        OR: [
                            { id: dto.assigneeId },
                            { clerkId: dto.assigneeId },
                        ],
                    },
                });
                data.assigneeId = assigneeUser ? assigneeUser.id : null;
            } else {
                data.assigneeId = null;
            }
        }
        if (dto.groupId !== undefined) data.groupId = dto.groupId;
        if (dto.status !== undefined) data.status = dto.status;
        if (dto.priority !== undefined) data.priority = dto.priority;

        const task = await this.prisma.taskEvent.update({
            where: { id },
            data,
            include: TASK_INCLUDE,
        });

        const formatted = this.formatTaskEvent(task);

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
