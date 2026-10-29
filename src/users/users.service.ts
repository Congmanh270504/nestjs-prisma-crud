import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedInitialUsers();
  }

  private async seedInitialUsers() {
    const count = await this.prisma.user.count();
    if (count === 0) {
      await this.prisma.user.createMany({
        data: [
          {
            id: 'dd503cf9-6c38-43cf-94cc-0d4032e2f77a',
            name: 'Leonardo Ramos',
            email: 'leonardo@example.com',
            role: 'ADMIN',
          },
          {
            id: 'f3b035ac-49f7-4e92-a715-35680bf63175',
            name: 'Michael Doe',
            email: 'michael@example.com',
            role: 'MEMBER',
          },
          {
            id: '3e36ea6e-78f3-40dd-ab8c-a6c737c3c422',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            role: 'MEMBER',
          },
          {
            id: 'a7aff6bd-a50a-4d6a-ab57-76f76bb27cf5',
            name: 'Robert Smith',
            email: 'robert@example.com',
            role: 'MEMBER',
          },
        ],
      });
      console.log('✅ Seeded 4 initial users for Calendar');
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
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
}
