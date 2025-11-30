import { Controller, Post, Get, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('select-movie/:id')
  async selectMovie(@Param('id') id: number) {
    await this.adminService.selectMovie(id);
    return { message: 'Next movie set' };
  }
  @Post('start-rating-session/:id')
  async startRatingSession(@Param('id') id: number) {
    await this.adminService.startRatingSession(id);
    return { message: 'Rating session started' };
  }
  @Post('idle')
  async setIdle() {
    await this.adminService.setIdle();
    return { message: 'Idle mode set' };
  }

  @Get('averages')
  async getAverages() {
    return this.adminService.getAverages();
  }
}