import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Movie } from '../movies/entities/movie.entity';
import { EventsGateway } from 'src/events/events.gateway';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingRepo: Repository<Rating>,
    private usersService: UsersService,
    private dataSource: DataSource, // For queries
    private eventsGateway: EventsGateway
  ) {}

  async create(movieId: number, createRatingDto: CreateRatingDto): Promise<Rating | null> {
    const movie = await this.dataSource.getRepository(Movie).findOneBy({ id: movieId });
    if (!movie) {
      throw new BadRequestException('Movie not found');
    }

    const existingRating = await this.ratingRepo.findOne({
      where: {
        movie: { id: movieId },
        userCode: createRatingDto.userCode
      }
    });

    if (existingRating) {
      throw new BadRequestException('You have already rated this movie');
    }
    else {
      const rating = this.ratingRepo.create({
        ...createRatingDto,
        movie,
    });
      const savedRating = await this.ratingRepo.save(rating);
      // Broadcast the rating update event
      const average = await this.getAverage(movieId);
      this.eventsGateway.broadcastRatingUpdate(movieId, average);
      const ratingCount = await this.getNumberOfRatingsForMovie(movieId);
      this.eventsGateway.broadcastRatingCountUpdate(movieId, ratingCount);
      return savedRating;
    }
  }

  async getAverage(movieId: number): Promise<number> {
    const result = await this.ratingRepo
      .createQueryBuilder('rating')
      .select('AVG(value)', 'average')
      .where('rating.movieId = :movieId', { movieId })
      .getRawOne();
    return parseFloat(result.average) || 0;
  }

async getAllAverages(): Promise<{ movieId: number; average: number }[]> {
  const results = await this.ratingRepo
    .createQueryBuilder('rating')
    .select('rating.movieId, AVG(rating.value) as average')
    .groupBy('rating.movieId')  // Group by the actual column name
    .getRawMany();
  
  return results.map((r) => ({ 
    movieId: parseInt(r.movieId), 
    average: parseFloat(r.average) 
  }));
}
  async getTotalRatings(): Promise<number> {
  return this.ratingRepo.count();
}
async getRatingStatistics(): Promise<{
  overallAverage: number;
  uniqueUsersRated: number;
}> {
  const [averageResult, uniqueUsersResult] = await Promise.all([
    this.ratingRepo
      .createQueryBuilder('rating')
      .select('AVG(value)', 'overallAverage')
      .getRawOne(),
    this.ratingRepo
      .createQueryBuilder('rating')
      .select('COUNT(DISTINCT userCode)', 'uniqueUsers')
      .getRawOne(),
  ]);

  return {
    overallAverage: parseFloat(averageResult.overallAverage) || 0,
    uniqueUsersRated: parseInt(uniqueUsersResult.uniqueUsers) || 0,
  };
}

async getMoviesWithRatingCounts(): Promise<{ movieId: number; ratingCount: number }[]> {
  const results = await this.ratingRepo
    .createQueryBuilder('rating')
    .select('rating.movieId, COUNT(rating.id) as ratingCount')
    .groupBy('rating.movieId')
    .getRawMany();

  return results.map((r) => ({
    movieId: r.movieId,
    ratingCount: parseInt(r.ratingCount),
  }));
}

async clearAllRatings(): Promise<void> {
  await this.ratingRepo.clear();
  await this.usersService.clearRatedMovies();
}

async getNumberOfRatingsForMovie(movieId: number): Promise<number> {
  return this.ratingRepo.count({ where: { movie: { id: movieId } } });
}
}