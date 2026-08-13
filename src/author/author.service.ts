import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthorService {
  constructor(private prisma: PrismaService) {}

  async getAllAuthors() {
    return [
      { id: 1, name: 'Nguyen Van A' },
      { id: 2, name: 'Tran Van B' },
    ];
  }
}
