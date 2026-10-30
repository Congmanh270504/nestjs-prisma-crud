import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { EventsModule } from './events/events.module';
import { RemindersModule } from './reminders/reminders.module';
import { InvitationsModule } from './invitations/invitations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    ProjectsModule,
    EventsModule,
    RemindersModule,
    InvitationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
