import { Controller, Get } from '@nestjs/common';
import { AuthorService } from './author.service';

@Controller('api/v1/author')
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}

  @Get()
  async getAllAuthors() {
    return this.authorService.getAllAuthors();
  }
}
