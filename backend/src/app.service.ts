// app.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MoviesService } from './movies/movies.service';
import { UsersService } from './users/users.service';
import { RatingsService } from './ratings/ratings.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly moviesService: MoviesService,
    private readonly usersService: UsersService,
    private readonly ratingsService: RatingsService,
  ) {}

  async getApplicationStatus(): Promise<any> {
    try {
      // Use feature services to get counts
      const [totalMovies, currentMovie, totalCodes, totalRatings] = await Promise.all([
        this.moviesService.getTotalMovies(),
        this.moviesService.findCurrent(),
        this.usersService.getTotalCodes(),
        this.ratingsService.getTotalRatings(),
      ]);

      // Get used codes count
      const usedCodes = await this.usersService.getUsedCodesCount();

      return {
        isInitialized: totalMovies > 0,
        currentMovie: currentMovie ? { 
          id: currentMovie.id, 
          title: currentMovie.title 
        } : null,
        isIdle: !currentMovie,
        statistics: {
          totalMovies,
          totalCodes,
          usedCodes,
          unusedCodes: totalCodes - usedCodes,
          totalRatings,
          participationRate: totalCodes > 0 ? ((usedCodes / totalCodes) * 100).toFixed(1) + '%' : '0%',
        },
      };
    } catch (error) {
      this.logger.error('Error getting application status', error);
      return {
        isInitialized: false,
        currentMovie: null,
        statistics: {
          totalMovies: 0,
          totalCodes: 0,
          usedCodes: 0,
          unusedCodes: 0,
          totalRatings: 0,
          participationRate: '0%',
        },
      };
    }
  }

  async initializeApplication(generateCodesCount?: number): Promise<any> {
    const result: any = {
      message: 'Application initialization completed',
      timestamp: new Date().toISOString(),
    };

    try {
      // Generate codes if requested
      if (generateCodesCount && generateCodesCount > 0) {
        this.logger.log(`Generating ${generateCodesCount} user codes`);
        const generatedCodes = await this.usersService.generateCodes(generateCodesCount);
        result.codesGenerated = generatedCodes.length;
        result.generatedCodes = generatedCodes.slice(0, 10); // Show first 10
        result.totalGeneratedCodes = generatedCodes.length;
      }

      // Check existing movies
      const existingMovies = await this.moviesService.findAll();
      result.existingMovies = existingMovies.length;
      result.movies = existingMovies.map(movie => ({ id: movie.id, title: movie.title }));

      return result;
    } catch (error) {
      this.logger.error('Error during initialization', error);
      result.error = error.message;
      return result;
    }
  }

  async getStatistics(): Promise<any> {
    try {
      const [totalMovies, totalRatings, totalCodes, ratingStats, moviesWithRatings] = await Promise.all([
        this.moviesService.getTotalMovies(),
        this.ratingsService.getTotalRatings(),
        this.usersService.getTotalCodes(),
        this.ratingsService.getRatingStatistics(),
        this.ratingsService.getMoviesWithRatingCounts(),
      ]);

      return {
        totalMovies,
        totalRatings,
        totalCodes,
        overallAverage: ratingStats.overallAverage,
        uniqueUsersRated: ratingStats.uniqueUsersRated,
        moviesWithRatings,
        participationRate: totalCodes > 0 ? ((ratingStats.uniqueUsersRated / totalCodes) * 100).toFixed(1) + '%' : '0%',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting statistics', error);
      return {
        totalMovies: 0,
        totalRatings: 0,
        totalCodes: 0,
        overallAverage: 0,
        uniqueUsersRated: 0,
        moviesWithRatings: [],
        participationRate: '0%',
        error: error.message,
      };
    }
  }

  async clearAllData(): Promise<{ message: string; success: boolean }> {
    // This should only be called in development/testing
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear data in production');
    }

    try {
      await Promise.all([
        this.ratingsService.clearAllRatings(),
        this.usersService.clearAllCodes(),
        this.moviesService.resetAllMovies(),
      ]);

      return { 
        message: 'All application data has been cleared successfully', 
        success: true 
      };
    } catch (error) {
      this.logger.error('Error clearing data', error);
      return { 
        message: 'Failed to clear data: ' + error.message, 
        success: false 
      };
    }
  }
}