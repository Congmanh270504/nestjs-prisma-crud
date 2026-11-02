import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Pusher from 'pusher';

@Injectable()
export class PusherService {
    private readonly logger = new Logger(PusherService.name);
    private pusher: Pusher;

    constructor(private configService: ConfigService) {
        const appId = this.configService.get<string>('PUSHER_APP_ID');
        const key = this.configService.get<string>('PUSHER_KEY');
        const secret = this.configService.get<string>('PUSHER_SECRET');
        const cluster = this.configService.get<string>('PUSHER_CLUSTER');

        this.pusher = new Pusher({
            appId,
            key,
            secret,
            cluster,
            useTLS: true,
        });

        this.logger.log('🚀 Pusher Service initialized successfully');
    }

    async trigger(channel: string | string[], event: string, data: any) {
        try {
            await this.pusher.trigger(channel, event, data);
            this.logger.log(
                `📡 Pusher event '${event}' triggered on channel '${channel}'`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to trigger Pusher event '${event}' on channel '${channel}':`,
                error,
            );
        }
    }
}
