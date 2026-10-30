import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvitationDto) {
    let groupId = dto.groupId;

    // If groupId is not provided, find or create a default group
    if (!groupId) {
      const existingGroup = await this.prisma.groups.findFirst({
        where: dto.userSentId ? { ownerId: dto.userSentId } : undefined,
      });

      if (existingGroup) {
        groupId = existingGroup.id;
      } else {
        // Fallback: pick any user or userSentId as group owner
        const owner = dto.userSentId
          ? await this.prisma.user.findUnique({ where: { id: dto.userSentId } })
          : await this.prisma.user.findFirst();

        if (!owner) {
          throw new BadRequestException('No user available to own the group');
        }

        const newGroup = await this.prisma.groups.create({
          data: {
            name: 'LoL Squad',
            ownerId: owner.id,
            color: 'gold',
            des: 'Default friends group',
          },
        });
        groupId = newGroup.id;
      }
    }

    // Generate unique code if not provided
    const code =
      dto.code ||
      `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return this.prisma.invitations.create({
      data: {
        code,
        groupId,
        userSentId: dto.userSentId,
        userReceivedId: dto.userReceivedId,
        des: dto.des || 'Friend request sent via League Client Dialog',
      },
      include: {
        group: true,
        userSent: true,
        userReceived: true,
      },
    });
  }

  async findAll() {
    return this.prisma.invitations.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        group: true,
        userSent: true,
        userReceived: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.invitations.findUnique({
      where: { id },
      include: {
        group: true,
        userSent: true,
        userReceived: true,
      },
    });
  }
}
