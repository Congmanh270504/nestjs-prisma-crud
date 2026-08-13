import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
});

export interface IdentifyResponse {
  match: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  confidence?: number;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
}

export interface FaceUser {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

/**
 * Đăng ký khuôn mặt mới
 */
export async function registerFace(
  name: string,
  imageBlob: Blob,
): Promise<RegisterResponse> {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('file', imageBlob, 'face.jpg');
  const res = await api.post<RegisterResponse>('/face/register', formData);
  return res.data;
}

/**
 * Nhận diện khuôn mặt
 */
export async function identifyFace(
  imageBlob: Blob,
  threshold = 0.68,
): Promise<IdentifyResponse> {
  const formData = new FormData();
  formData.append('file', imageBlob, 'face.jpg');
  const res = await api.post<IdentifyResponse>(
    `/face/identify?threshold=${threshold}`,
    formData,
  );
  return res.data;
}

/**
 * Lấy danh sách người đã đăng ký
 */
export async function listUsers(): Promise<FaceUser[]> {
  const res = await api.get<FaceUser[]>('/face/users');
  return res.data;
}
