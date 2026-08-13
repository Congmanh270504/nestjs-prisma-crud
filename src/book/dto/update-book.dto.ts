import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';

/**
 * PartialType sẽ tự động lấy tất cả các field của CreateBookDto và biến chúng thành optional (có hay không đều được).
 * Đồng thời giữ nguyên toàn bộ các Validation Rule của CreateBookDto!
 */
export class UpdateBookDto extends PartialType(CreateBookDto) {}
