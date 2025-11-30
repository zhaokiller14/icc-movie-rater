import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private movieRepo: Repository<Movie>,
  ) {}

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const movie = this.movieRepo.create(createMovieDto);
    return this.movieRepo.save(movie);
  }

  async findAll(): Promise<Movie[]> {
    return this.movieRepo.find();
  }

  async findCurrent(): Promise<Movie | null> {
    return this.movieRepo.findOne({ where: { isCurrent: true } });
  }

async setCurrent(movieId?: number): Promise<void> {
  await this.movieRepo
    .createQueryBuilder()
    .update(Movie)
    .set({ isCurrent: false })
    .execute();

  if (movieId) {
    await this.movieRepo.update(movieId, { isCurrent: true });
  }
}
  async getTotalMovies(): Promise<number> {
  return this.movieRepo.count();
}
async resetAllMovies(): Promise<void> {
  await this.movieRepo.update({}, { isCurrent: false });
}
}