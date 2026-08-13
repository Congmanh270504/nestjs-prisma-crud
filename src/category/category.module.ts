import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService], // <-- Không khai báo PrismaService ở đây!
})
export class CategoryModule {}
