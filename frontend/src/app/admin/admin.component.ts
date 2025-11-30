import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Movie, MovieWithAverage, AverageResponse } from '../services/api.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class AdminComponent implements OnInit {
  movies: MovieWithAverage[] = [];
  currentMovie: MovieWithAverage | null = null;
  isLoading = true;
  currentView: 'idle' | 'rating' = 'idle';
  loadingRatings: Set<number> = new Set(); // Track which movies are loading rating counts
  private pendingRequests = 0;
  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadMovies();
    this.loadCurrentMovie();
  }

  private completeLoading(): void {
    this.pendingRequests--;
    if (this.pendingRequests <= 0) {
      this.isLoading = false;
      this.pendingRequests = 0;
    }
  }

  loadMovies(): void {
    this.isLoading = true;
    this.pendingRequests = 1;
    
    this.apiService.getAllMovies().subscribe({
      next: (movies) => {
        this.movies = movies;
        this.loadAverages();
      },
      error: (error) => {
        console.error('Error loading movies:', error);
        this.completeLoading();
      }
    });
  }

  loadAverages(): void {
    this.pendingRequests++;
    
    this.apiService.getAverages().subscribe({
      next: (averages: AverageResponse[]) => {
        // Map averages to movies
        this.movies = this.movies.map(movie => {
          const averageData = averages.find(avg => avg.movieId === movie.id);
          return {
            ...movie,
            average: averageData?.average
          };
        });
        
        // Load rating counts for all movies
        this.loadAllRatingCounts();
        
        // Also update currentMovie if it exists
        if (this.currentMovie) {
          const currentMovieAverage = averages.find(avg => avg.movieId === this.currentMovie!.id);
          this.currentMovie = {
            ...this.currentMovie,
            average: currentMovieAverage?.average
          };
          this.loadRatingCount(this.currentMovie.id);
        }
        
        this.completeLoading();
      },
      error: (error) => {
        console.error('Error loading averages:', error);
        // Even if averages fail, try to load rating counts
        this.loadAllRatingCounts();
        this.completeLoading();
      }
    });
  }

  loadAllRatingCounts(): void {
    if (this.movies.length === 0) {
      return;
    }
    
    this.pendingRequests += this.movies.length;
    this.movies.forEach(movie => {
      this.loadRatingCount(movie.id);
    });
  }

  loadRatingCount(movieId: number): void {
    this.loadingRatings.add(movieId);
    
    this.apiService.getNumberOfRatingsForMovie(movieId).subscribe({
      next: (count) => {
        this.movies = this.movies.map(movie => 
          movie.id === movieId ? { ...movie, ratingCount: count } : movie
        );
        
        // Update currentMovie if it's the one we're loading
        if (this.currentMovie && this.currentMovie.id === movieId) {
          this.currentMovie = { ...this.currentMovie, ratingCount: count };
        }
        
        this.loadingRatings.delete(movieId);
        this.completeLoading();
      },
      error: (error) => {
        console.error(`Error loading rating count for movie ${movieId}:`, error);
        this.loadingRatings.delete(movieId);
        this.completeLoading();
      }
    });
  }

  loadCurrentMovie(): void {
    this.apiService.getCurrentMovie().subscribe({
      next: (movie) => {
        this.currentMovie = movie;
        // If we already have data loaded, update the current movie
        if (this.movies.length > 0) {
          const movieWithData = this.movies.find(m => m.id === movie.id);
          if (movieWithData) {
            this.currentMovie = { 
              ...movie, 
              average: movieWithData.average,
              ratingCount: movieWithData.ratingCount
            };
          }
        } else {
          // Load rating count for current movie if we don't have it yet
          this.loadRatingCount(movie.id);
        }
      },
      error: (error) => {
        console.error('Error loading current movie:', error);
        this.currentMovie = null;
      }
    });
  }

  selectMovie(movieId: number): void {
    this.apiService.selectMovie(movieId).subscribe({
      next: () => {
        this.loadCurrentMovie();
        this.currentView = 'idle';
      },
      error: (error) => {
        console.error('Error setting next movie:', error);
      }
    });
  }

  startRatingPeriod(): void {
    if (this.currentMovie) {
      this.apiService.startRatingSession(this.currentMovie.id).subscribe({
        next: () => {
          this.currentView = 'rating';
        },
        error: (error) => {
          console.error('Error starting rating session:', error);
        }
      });
    }
  }

  setIdle(): void {
    this.apiService.setIdle().subscribe({
      next: () => {
        this.currentView = 'idle';
      },
      error: (error) => {
        console.error('Error setting idle:', error);
      }
    });
  }

  getStatusColor(): string {
    return this.currentView === 'rating' ? 'bg-primary' : 'bg-muted';
  }

  getStatusText(): string {
    return this.currentView === 'idle' ? 'Screening in Progress' : 'Rating Period';
  }

  getCurrentMovieDisplay(): string {
    return this.currentMovie ? this.currentMovie.title : 'No movie selected';
  }

  formatAverage(average: number | null | undefined): string {
    if (average === null || average === undefined) return 'No ratings';
    return average.toFixed(1);
  }

  getAverageColor(average: number | null | undefined): string {
    if (average === null || average === undefined) return 'text-muted-foreground';
    if (average >= 4) return 'text-green-500';
    if (average >= 3) return 'text-yellow-500';
    return 'text-red-500';
  }

  formatRatingCount(count: number | undefined): string {
    if (count === undefined || count === null) return 'Loading...';
    return `${count} rating${count !== 1 ? 's' : ''}`;
  }

  isRatingLoading(movieId: number): boolean {
    return this.loadingRatings.has(movieId);
  }
}