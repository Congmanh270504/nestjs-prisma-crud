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
    if (count < 20) {
      const mockLolUsers = [
        { clerkId: 'KeeperOfYuleLads#9842', role: 'MEMBER' as const },
        { clerkId: 'bourdazn#NA1', role: 'MEMBER' as const },
        { clerkId: 'Scortturbo#6969', role: 'MEMBER' as const },
        { clerkId: 'Heartineye#NA1', role: 'MEMBER' as const },
        { clerkId: 'AgoDeus#999', role: 'MEMBER' as const },
        { clerkId: 'Freakybob7#NA1', role: 'MEMBER' as const },
        { clerkId: 'Th0mas96#NA1', role: 'MEMBER' as const },
        { clerkId: 'Raowin#NA1', role: 'MEMBER' as const },
        { clerkId: 'Goyjak#911', role: 'MEMBER' as const },
        { clerkId: 'fartin n shi#6456', role: 'MEMBER' as const },
        { clerkId: 'Zedizije#8923', role: 'MEMBER' as const },
        { clerkId: 'Donkle#6666', role: 'MEMBER' as const },
        { clerkId: 'King Frosty#KingF', role: 'MEMBER' as const },
        { clerkId: 'ShadowBlade#EUW', role: 'MEMBER' as const },
        { clerkId: 'MysticFox#VN1', role: 'MEMBER' as const },
        { clerkId: 'DragonSlayer#KR1', role: 'MEMBER' as const },
      ];

      for (const u of mockLolUsers) {
        const exists = await this.prisma.user.findFirst({
          where: { clerkId: u.clerkId },
        });
        if (!exists) {
          await this.prisma.user.create({
            data: {
              clerkId: u.clerkId,
              role: u.role,
            },
          });
        }
      }
      console.log('✅ Ensured 20 recent users in DB for League Dialog suggestions');
    }
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
