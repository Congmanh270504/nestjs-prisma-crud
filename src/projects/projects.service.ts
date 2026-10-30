import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedInitialProjects();
  }

  private async seedInitialProjects() {
    const count = await this.prisma.project.count();
    if (count === 0) {
      const firstUser = await this.prisma.user.findFirst();
      if (firstUser) {
        await this.prisma.project.createMany({
          data: [
            {
              name: 'Company Sprint',
              color: 'blue',
              description: 'Sprint development and internal meetings',
              ownerId: firstUser.id,
            },
            {
              name: 'Client Projects',
              color: 'purple',
              description: 'External client deliverables & demos',
              ownerId: firstUser.id,
            },
          ],
        });
        console.log('✅ Seeded initial projects');
      }
    }
  }

  async findAll() {
    return this.prisma.project.findMany({
      include: {
        owner: { select: { id: true, clerkId: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: true,
        tasks: { orderBy: { startDate: 'asc' } },
      },
    });
  }

  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
