import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedInitialEvents();
  }

  private async seedInitialEvents() {
    const count = await this.prisma.taskEvent.count();
    if (count === 0) {
      const users = await this.prisma.user.findMany({ take: 4 });
      const projects = await this.prisma.project.findMany({ take: 2 });
      if (users.length > 0) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        await this.prisma.taskEvent.createMany({
          data: [
            {
              title: 'Team Stand-up & Daily Sprint',
              description: 'Review tasks and blockers for today',
              startDate: new Date(year, month, now.getDate(), 9, 0),
              endDate: new Date(year, month, now.getDate(), 10, 0),
              color: 'blue',
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              creatorId: users[0].id,
              projectId: projects[0]?.id,
            },
            {
              title: 'Client Demo: Product Roadmap',
              description: 'Present the latest features and collect feedback',
              startDate: new Date(year, month, now.getDate(), 14, 0),
              endDate: new Date(year, month, now.getDate(), 15, 30),
              color: 'purple',
              status: 'TODO',
              priority: 'URGENT',
              creatorId: users[1]?.id || users[0].id,
              projectId: projects[1]?.id,
            },
            {
              title: 'NestJS Architecture & Prisma Review',
              description: 'Deep dive into service layers, DTO validation and DB relations',
              startDate: new Date(year, month, now.getDate() + 1, 10, 0),
              endDate: new Date(year, month, now.getDate() + 1, 12, 0),
              color: 'green',
              status: 'TODO',
              priority: 'MEDIUM',
              creatorId: users[2]?.id || users[0].id,
              projectId: projects[0]?.id,
            },
            {
              title: 'Upstash QStash Webhook Testing',
              description: 'Verify asynchronous delayed reminder execution',
              startDate: new Date(year, month, now.getDate() + 2, 16, 0),
              endDate: new Date(year, month, now.getDate() + 2, 17, 0),
              color: 'orange',
              status: 'TODO',
              priority: 'MEDIUM',
              creatorId: users[0].id,
              projectId: projects[0]?.id,
            },
          ],
        });
        console.log('✅ Seeded initial task events for Calendar');
      }
    }
  }

  async findAll(params: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    projectId?: string;
  }) {
    const { startDate, endDate, userId, projectId } = params;

    const where: any = {};

    if (userId && userId !== 'all') {
      where.OR = [{ creatorId: userId }, { assigneeId: userId }];
    }

    if (projectId) {
      where.projectId = projectId;
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
        project: { select: { id: true, name: true, color: true } },
        reminders: true,
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
      project: task.project,
      reminders: task.reminders,
    }));
  }

  async findOne(id: string) {
    const task = await this.prisma.taskEvent.findUnique({
      where: { id },
      include: {
        creator: true,
        assignee: true,
        project: true,
        reminders: true,
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
      project: task.project,
      reminders: task.reminders,
    };
  }

  async create(dto: CreateEventDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    const task = await this.prisma.taskEvent.create({
      data: {
        title: dto.title,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        color: dto.color,
        creatorId: dto.userId,
        projectId: dto.projectId,
        status: dto.status || 'TODO',
        priority: dto.priority || 'MEDIUM',
      },
      include: {
        creator: { select: { id: true, clerkId: true } },
        project: true,
      },
    });

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
      project: task.project,
    };
  }

  async update(id: string, dto: UpdateEventDto) {
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.userId !== undefined) data.creatorId = dto.userId;
    if (dto.projectId !== undefined) data.projectId = dto.projectId;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;

    const task = await this.prisma.taskEvent.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, clerkId: true } },
        project: true,
      },
    });

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
      project: task.project,
    };
  }

  async remove(id: string) {
    return this.prisma.taskEvent.delete({
      where: { id },
    });
  }
}
