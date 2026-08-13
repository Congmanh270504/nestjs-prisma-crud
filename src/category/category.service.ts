import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async getAllCategories() {
    return [
      { id: 1, name: 'Tieu Thuyet' },
      { id: 2, name: 'Kinh Te' },
    ];
  }
}
