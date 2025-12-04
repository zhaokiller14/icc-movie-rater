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
async getRatedMovies(@Param('code') code: string) {
  const movieIds = await this.usersService.getCodeRatedMovies(code);
  return { userRatedMovies: movieIds };
}
@Get('used-codes-count')
async getUsedCodesCount(): Promise<number> {
  return this.usersService.getUsedCodesCount();
}

@Get('used-codes-list')
async getUsedCodesList(): Promise<UserCode[]> {
  return this.usersService.getUsedCodesList();
}

@Get('is-admin/:code')
async isAdmin(@Param('code') code: string): Promise<boolean> {
  return this.usersService.isAdmin(code);
}

@Get('is-valid/:code')
async isValidCode(@Param('code') code: string): Promise<{ isValid: boolean }> {
  try {
    await this.usersService.validateCode(code);
    return { isValid: true };
  } catch {
    return { isValid: false };
  }
}
}