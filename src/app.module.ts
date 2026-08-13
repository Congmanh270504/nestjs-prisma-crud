import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { BookModule } from './book/book.module';
import { AuthorModule } from './author/author.module';
import { CategoryModule } from './category/category.module';
import { FaceModule } from './face/face.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BookModule,
    AuthorModule,
    CategoryModule,
    FaceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
