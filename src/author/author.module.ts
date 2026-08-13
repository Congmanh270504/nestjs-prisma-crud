import { Module } from '@nestjs/common';
import { AuthorController } from './author.controller';
import { AuthorService } from './author.service';

@Module({
  controllers: [AuthorController],
  providers: [AuthorService], // <-- Lưu ý: Không hề khai báo PrismaService ở đây!
})
export class AuthorModule {}
