import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { RemindersModule } from './reminders/reminders.module';
import { InvitationsModule } from './invitations/invitations.module';
import { GroupsModule } from './groups/groups.module';
import { PusherModule } from './pusher/pusher.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        UsersModule,
        EventsModule,
        RemindersModule,
        InvitationsModule,
        GroupsModule,
        PusherModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
