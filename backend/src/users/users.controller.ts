import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserCode } from './entities/user-code.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('generate-codes')
  async generateCodes(@Body('count') count: number): Promise<string[]> {
    return this.usersService.generateCodes(count);
  }
  @Get('codes')
  async getAllCodes(): Promise<UserCode[]> {
    return this.usersService.getAllCodes();
  }
  @Get('rated-movies/:code')
  async getCodeRatedMovies(@Param('code') code: string): Promise<number[]> {
    return this.usersService.getCodeRatedMovies(code);
  }
@Get('used-codes-count')
async getUsedCodesCount(): Promise<number> {
  return this.usersService.getUsedCodesCount();
}

@Get('used-codes-list')
async getUsedCodesList(): Promise<UserCode[]> {
  return this.usersService.getUsedCodesList();
}
}