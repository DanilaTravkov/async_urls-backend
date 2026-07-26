import { Body, Controller, Get, Header, HttpCode, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import type { Request } from 'express';
import { CreateCatDto } from './create-cat.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('cats')
  // @HttpCode(202)
  getCats(@Req() request: Request): string {
    return 'This will return cats';
  }

  @Post('cats')
  @Header('Cache-Control', 'no-store')
  @HttpCode(204)
  createCat(@Body() createCatDto: CreateCatDto): string {
    return 'This will add a new cat';
  }

}
