import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';
import * as FormData from 'form-data';

export interface IdentifyResult {
  match: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  confidence?: number;
}

interface RawFaceUser {
  id: string;
  name: string;
  avatar_url: string | null;
  similarity: number;
}

@Injectable()
export class FaceService {
  constructor(private prisma: PrismaService) {}

  private get aiServiceUrl(): string {
    return process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Gửi ảnh tới Python AI Microservice, nhận về Vector Embedding 512 chiều
   */
  async extractVector(imageBuffer: Buffer): Promise<number[]> {
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: 'face.jpg',
      contentType: 'image/jpeg',
    });

    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/extract-embedding`,
        formData,
        { headers: formData.getHeaders() },
      );
      return response.data.embedding as number[];
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Lỗi kết nối AI Service: ${err?.message ?? 'Unknown error'}`,
      );
    }
  }

  /**
   * Đăng ký người dùng mới kèm vector khuôn mặt vào database
   */
  async registerUser(
    name: string,
    imageBuffer: Buffer,
    avatarUrl?: string,
  ): Promise<{ success: boolean; message: string; userId?: string }> {
    if (!name?.trim()) {
      throw new BadRequestException('Tên người dùng không được để trống');
    }

    const vector = await this.extractVector(imageBuffer);
    const vectorString = JSON.stringify(vector);
    const avatar = avatarUrl ?? null;

    const result = await this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO face_users (id, name, avatar_url, embedding, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        ${name.trim()},
        ${avatar},
        ${vectorString}::vector,
        NOW(),
        NOW()
      )
      RETURNING id;
    `;

    const userId = result?.[0]?.id;
    return {
      success: true,
      message: `Đăng ký khuôn mặt thành công cho "${name.trim()}"`,
      userId,
    };
  }

  /**
   * Nhận diện khuôn mặt: tìm người có độ tương đồng Cosine cao nhất trong DB
   * @param imageBuffer  Ảnh mặt đã crop từ client
   * @param threshold    Ngưỡng độ tương đồng tối thiểu (0.0 - 1.0), mặc định 0.68
   */
  async identifyFace(
    imageBuffer: Buffer,
    threshold = 0.68,
  ): Promise<IdentifyResult> {
    const targetVector = await this.extractVector(imageBuffer);
    const vectorString = JSON.stringify(targetVector);

    const matches = await this.prisma.$queryRaw<RawFaceUser[]>`
      SELECT
        id,
        name,
        avatar_url,
        1 - (embedding <=> ${vectorString}::vector) AS similarity
      FROM face_users
      WHERE 1 - (embedding <=> ${vectorString}::vector) >= ${threshold}
      ORDER BY embedding <=> ${vectorString}::vector ASC
      LIMIT 1;
    `;

    if (!matches || matches.length === 0) {
      return {
        match: false,
        message: 'Không tìm thấy khuôn mặt trùng khớp trong hệ thống',
      };
    }

    const best = matches[0];
    return {
      match: true,
      user: {
        id: best.id,
        name: best.name,
        avatarUrl: best.avatar_url,
      },
      confidence: Math.round(Number(best.similarity) * 100),
    };
  }

  /**
   * Lấy danh sách tất cả người đã đăng ký khuôn mặt
   */
  async listUsers() {
    const users = await this.prisma.$queryRaw<
      { id: string; name: string; avatar_url: string | null; created_at: Date }[]
    >`
      SELECT id, name, avatar_url, created_at
      FROM face_users
      ORDER BY created_at DESC;
    `;
    return users;
  }
}
