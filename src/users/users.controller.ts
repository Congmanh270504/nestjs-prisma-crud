import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('recent')
  findRecent(@Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 20;
    return this.usersService.findAll(take);
  }

  @Get()
  findAll(@Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 20;
    return this.usersService.findAll(take);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post('sync')
  sync(@Body() dto: CreateUserDto) {
    return this.usersService.sync(dto.clerkId);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
