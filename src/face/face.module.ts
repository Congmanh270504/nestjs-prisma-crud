import { Module } from '@nestjs/common';
import { FaceService } from './face.service';
import { FaceController } from './face.controller';

@Module({
  providers: [FaceService],
  controllers: [FaceController]
})
export class FaceModule {}
