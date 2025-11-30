import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MoviesModule } from 'src/movies/movies.module';
import { RatingsModule } from 'src/ratings/ratings.module';
import { EventsGateway } from 'src/events/events.gateway';

@Module({
  controllers: [AdminController],
  providers: [AdminService, EventsGateway],
  imports : [MoviesModule,RatingsModule],
  exports: [AdminService],

})
export class AdminModule {}
