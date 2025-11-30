// movies.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { Movie } from './entities/movie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movie])], // This is crucial
  controllers: [MoviesController],
  providers: [MoviesService],
  exports: [MoviesService], // Export if other modules need to use MoviesService
})
export class MoviesModule {}