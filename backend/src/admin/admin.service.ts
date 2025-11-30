import { Injectable } from '@nestjs/common';
import { MoviesService } from '../movies/movies.service';
import { RatingsService } from '../ratings/ratings.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class AdminService {
  constructor(
    private moviesService: MoviesService,
    private ratingsService: RatingsService,
    private eventsGateway: EventsGateway,
  ) {}

  async selectMovie(movieId: number): Promise<void> {
    await this.moviesService.setCurrent(movieId);
  }
  async startRatingSession(movieId: number): Promise<void> {
    this.eventsGateway.broadcastNewMovie(movieId);
  }
  async setIdle(): Promise<void> {
    this.eventsGateway.broadcastIdle();
  }

  async getAverages(): Promise<{ movieId: number; average: number }[]> {
    return this.ratingsService.getAllAverages();
  }
}