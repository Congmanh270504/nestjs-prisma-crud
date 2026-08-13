import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('api/v1/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getAllCategories() {
    return this.categoryService.getAllCategories();
  }
}
