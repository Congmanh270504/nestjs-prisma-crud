import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@upstash/qstash';
import { PrismaService } from '../prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);
    private qstash: Client | null = null;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        const token = this.configService.get<string>('QSTASH_TOKEN');
        if (token) {
            this.qstash = new Client({ token });
            this.logger.log(
                '🚀 Upstash QStash Client initialized successfully',
            );
        } else {
            this.logger.warn(
                '⚠️ QSTASH_TOKEN not provided. Reminder scheduling will be mocked in DB.',
            );
        }
    }

    async create(dto: CreateReminderDto) {
        const task = await this.prisma.taskEvent.findUnique({
            where: { id: dto.taskEventId },
        });
        if (!task) {
            throw new NotFoundException(
                `Task with ID ${dto.taskEventId} not found`,
            );
        }

        const remindDate = new Date(dto.remindAt);
        let messageId: string | null = null;

        // Schedule message via Upstash QStash
        if (this.qstash) {
            try {
                const appUrl =
                    this.configService.get<string>('APP_URL') ||
                    'http://localhost:3002';
                const notBeforeTimestamp = Math.floor(
                    remindDate.getTime() / 1000,
                );

                const res = await this.qstash.publishJSON({
                    url: `${appUrl}/reminders/webhook`,
                    body: {
                        taskEventId: task.id,
                        title: task.title,
                        startDate: task.startDate,
                        remindAt: dto.remindAt,
                    },
                    notBefore: notBeforeTimestamp,
                });

                messageId = res.messageId;
                this.logger.log(
                    `📅 QStash scheduled reminder for task "${task.title}" with messageId: ${messageId}`,
                );
            } catch (error) {
                this.logger.error(
                    `Failed to publish message to QStash: ${error.message}`,
                    error.stack,
                );
            }
        }

        return this.prisma.reminder.create({
            data: {
                taskEventId: dto.taskEventId,
                remindAt: remindDate,
                channel: dto.channel || 'WEBHOOK',
                messageId,
                status: 'SCHEDULED',
            },
        });
    }

    async findAll(taskEventId?: string) {
        return this.prisma.reminder.findMany({
            where: taskEventId ? { taskEventId } : undefined,
            include: {
                taskEvent: {
                    select: {
                        id: true,
                        title: true,
                        startDate: true,
                        color: true,
                    },
                },
            },
            orderBy: { remindAt: 'asc' },
        });
    }

    async handleWebhook(payload: any) {
        this.logger.log(
            `🔔 Received QStash Webhook Reminder: ${JSON.stringify(payload)}`,
        );
        if (payload.taskEventId) {
            await this.prisma.reminder.updateMany({
                where: {
                    taskEventId: payload.taskEventId,
                    status: 'SCHEDULED',
                },
                data: { status: 'SENT' },
            });
        }
        return { success: true, message: 'Reminder processed' };
    }

    async remove(id: string) {
        const reminder = await this.prisma.reminder.findUnique({
            where: { id },
        });
        if (!reminder) {
            throw new NotFoundException(`Reminder with ID ${id} not found`);
        }

        if (this.qstash && reminder.messageId) {
            try {
                await this.qstash.messages.delete(reminder.messageId);
                this.logger.log(
                    `🗑️ Cancelled QStash messageId: ${reminder.messageId}`,
                );
            } catch (error) {
                this.logger.warn(
                    `Could not cancel QStash message: ${error.message}`,
                );
            }
        }

        return this.prisma.reminder.delete({ where: { id } });
    }
}
