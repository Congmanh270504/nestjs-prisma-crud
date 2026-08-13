import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FaceService } from './face.service';

@Controller('face')
export class FaceController {
  constructor(private readonly faceService: FaceService) {}

  /**
   * POST /face/register
   * Body: multipart/form-data với fields: name (string), file (image)
   * Đăng ký khuôn mặt mới vào hệ thống
   */
  @Post('register')
  @UseInterceptors(FileInterceptor('file'))
  async register(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('avatarUrl') avatarUrl?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng upload ảnh khuôn mặt');
    }
    if (!name?.trim()) {
      throw new BadRequestException('Vui lòng nhập tên người dùng');
    }

    return this.faceService.registerUser(name, file.buffer, avatarUrl);
  }

  /**
   * POST /face/identify
   * Body: multipart/form-data với field: file (image)
   * Query: threshold (optional, mặc định 0.68)
   * Nhận diện khuôn mặt và trả về thông tin người trùng khớp
   */
  @Post('identify')
  @UseInterceptors(FileInterceptor('file'))
  async identify(
    @UploadedFile() file: Express.Multer.File,
    @Query('threshold') threshold?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng upload ảnh khuôn mặt cần nhận diện');
    }

    const parsedThreshold = threshold ? parseFloat(threshold) : 0.68;
    if (isNaN(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > 1) {
      throw new BadRequestException('Threshold phải là số từ 0.0 đến 1.0');
    }

    return this.faceService.identifyFace(file.buffer, parsedThreshold);
  }

  /**
   * GET /face/users
   * Lấy danh sách tất cả người đã đăng ký khuôn mặt
   */
  @Get('users')
  async listUsers() {
    return this.faceService.listUsers();
  }
}
