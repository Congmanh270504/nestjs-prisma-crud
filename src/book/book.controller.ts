import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Req,
    Res,
} from '@nestjs/common';
import { Book, ResponseType } from './book.model';
import { BookService } from './book.service';
import { Request, Response } from 'express';

@Controller('api/v1/book')
export class BookController {
    constructor(private readonly bookService: BookService) {}

    @Get()
    async getAllBook(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<ResponseType> {
        const result = await this.bookService.getAllBook();

        if (result.length === 0) {
            response.status(404);
            return {
                status: '404',
                message: 'Data not found!',
                result: [],
            };
        }

        response.status(200);
        return {
            status: 'Ok!',
            message: 'Successfully fetch data!',
            result: result,
        };
    }

    @Post()
    async postBook(
        @Body() postData: Book,
        @Res({ passthrough: true }) response: Response,
    ): Promise<ResponseType> {
        const createBook = await this.bookService.createBook(postData);

        if (!createBook) {
            response.status(404);
            return {
                status: 'Not Found!',
                message: 'Data not found!',
                result: null,
            };
        }

        response.status(200);
        return {
            status: 'Ok!',
            message: 'Successfully create data!',
            result: createBook,
        };
    }

    @Get(':id')
    async getBook(@Param('id') id: number): Promise<Book | null> {
        return this.bookService.getBook(id);
    }

    @Delete(':id')
    async deleteBook(@Param('id') id: number): Promise<Book> {
        return this.bookService.deleteBook(id);
    }

    @Put(':id')
    async updateBook(
        @Param('id') id: number,
        @Body() data: Book,
    ): Promise<Book> {
        return this.bookService.updateBook(id, data);
    }
}
