// ratings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { Rating } from './entities/rating.entity';
import { UsersModule } from 'src/users/users.module';
import { EventsGateway } from 'src/events/events.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Rating]), UsersModule],
  controllers: [RatingsController],
  providers: [RatingsService, EventsGateway],
  exports: [RatingsService],
})
export class RatingsModule {}