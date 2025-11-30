import { Controller, Get, Post, Body, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  async getApplicationStatus() {
    return await this.appService.getApplicationStatus();
  }

  @Post('initialize')
  async initializeApplication(@Body('generateCodes') generateCodesCount?: number) {
    return await this.appService.initializeApplication(generateCodesCount);
  }

  @Get('stats')
  async getStatistics() {
    return await this.appService.getStatistics();
  }
}