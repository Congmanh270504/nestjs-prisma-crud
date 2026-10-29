import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll(@Query('taskEventId') taskEventId?: string) {
    return this.remindersService.findAll(taskEventId);
  }

  @Post()
  create(@Body() dto: CreateReminderDto) {
    return this.remindersService.create(dto);
  }

  @Post('webhook')
  handleWebhook(@Body() payload: any) {
    return this.remindersService.handleWebhook(payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.remindersService.remove(id);
  }
}
