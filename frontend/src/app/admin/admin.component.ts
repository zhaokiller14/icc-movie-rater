import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Movie, MovieWithAverage, AverageResponse } from '../services/api.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class AdminComponent implements OnInit {
  private apiService = inject(ApiService);

  // Signals for state management
  movies = signal<MovieWithAverage[]>([]);
  currentMovie = signal<MovieWithAverage | null>(null);
  isLoading = signal(true);
  currentView = signal<'idle' | 'rating'>('idle');
  loadingRatings = signal<Set<number>>(new Set());

  // Computed values
  totalMovies = computed(() => this.movies().length);
  totalRatings = computed(() => 
    this.movies().reduce((sum, movie) => sum + (movie.ratingCount || 0), 0)
  );
  
  averageOfAllMovies = computed(() => {
    const moviesWithRatings = this.movies().filter(m => m.average && m.average > 0);
    if (moviesWithRatings.length === 0) return 0;
    const total = moviesWithRatings.reduce((sum, m) => sum + m.average!, 0);
    return total / moviesWithRatings.length;
  });

  // Template helpers as computed signals
  statusColor = computed(() => 
    this.currentView() === 'rating' ? 'bg-primary' : 'bg-muted'
  );

  statusText = computed(() => 
    this.currentView() === 'idle' ? 'Screening in Progress' : 'Rating Period'
  );

  currentMovieDisplay = computed(() => 
    this.currentMovie() ? this.currentMovie()!.title : 'No movie selected'
  );

  ngOnInit(): void {
    this.loadMovies();
    this.loadCurrentMovie();
  }

  loadMovies(): void {
    this.isLoading.set(true);
    
    this.apiService.getAllMovies().pipe(
      tap(movies => {
        this.movies.set(movies);
        this.loadAverages();
      }),
      catchError(error => {
        console.error('Error loading movies:', error);
        this.isLoading.set(false);
        return of([]);
      })
    ).subscribe();
  }

  loadAverages(): void {
    this.apiService.getAverages().pipe(
      tap((averages: AverageResponse[]) => {
        // Update movies with averages
        this.movies.update(currentMovies => 
          currentMovies.map(movie => {
            const averageData = averages.find(avg => avg.movieId === movie.id);
            return {
              ...movie,
              average: averageData?.average
            };
          })
        );
        
        // Update current movie if it exists
        const currentMovieValue = this.currentMovie();
        if (currentMovieValue) {
          const currentMovieAverage = averages.find(avg => avg.movieId === currentMovieValue.id);
          this.currentMovie.update(movie => movie ? {
            ...movie,
            average: currentMovieAverage?.average
          } : null);
        }
        
        this.loadAllRatingCounts();
      }),
      catchError(error => {
        console.error('Error loading averages:', error);
        this.loadAllRatingCounts();
        return of([]);
      })
    ).subscribe();
  }

  loadAllRatingCounts(): void {
    const movies = this.movies();
    if (movies.length === 0) {
      this.isLoading.set(false);
      return;
    }

    let completedRequests = 0;
    
    movies.forEach(movie => {
      this.loadRatingCount(movie.id, () => {
        completedRequests++;
        if (completedRequests === movies.length) {
          this.isLoading.set(false);
        }
      });
    });
  }

  loadRatingCount(movieId: number, onComplete?: () => void): void {
    this.loadingRatings.update(loadingSet => {
      const newSet = new Set(loadingSet);
      newSet.add(movieId);
      return newSet;
    });

    this.apiService.getNumberOfRatingsForMovie(movieId).pipe(
      tap(count => {
        // Update movies array
        this.movies.update(currentMovies => 
          currentMovies.map(movie => 
            movie.id === movieId ? { ...movie, ratingCount: count } : movie
          )
        );

        // Update current movie if it matches
        const currentMovieValue = this.currentMovie();
        if (currentMovieValue?.id === movieId) {
          this.currentMovie.update(movie => movie ? { ...movie, ratingCount: count } : null);
        }

        this.loadingRatings.update(loadingSet => {
          const newSet = new Set(loadingSet);
          newSet.delete(movieId);
          return newSet;
        });
        
        onComplete?.();
      }),
      catchError(error => {
        console.error(`Error loading rating count for movie ${movieId}:`, error);
        this.loadingRatings.update(loadingSet => {
          const newSet = new Set(loadingSet);
          newSet.delete(movieId);
          return newSet;
        });
        onComplete?.();
        return of(0);
      })
    ).subscribe();
  }

  loadCurrentMovie(): void {
    this.apiService.getCurrentMovie().pipe(
      tap(movie => {
        this.currentMovie.set(movie);
        
        // If we already have data, update the current movie
        const moviesValue = this.movies();
        if (moviesValue.length > 0) {
          const movieWithData = moviesValue.find(m => m.id === movie.id);
          if (movieWithData) {
            this.currentMovie.set({ 
              ...movie, 
              average: movieWithData.average,
              ratingCount: movieWithData.ratingCount
            });
          }
        } else {
          // Load rating count for current movie
          this.loadRatingCount(movie.id);
        }
      }),
      catchError(error => {
        console.error('Error loading current movie:', error);
        this.currentMovie.set(null);
        return of(null);
      })
    ).subscribe();
  }

  selectMovie(movieId: number): void {
    this.apiService.selectMovie(movieId).pipe(
      tap(() => {
        this.loadCurrentMovie();
        this.currentView.set('idle');
      }),
      catchError(error => {
        console.error('Error setting next movie:', error);
        return of(null);
      })
    ).subscribe();
  }

  startRatingPeriod(): void {
    const currentMovieValue = this.currentMovie();
    if (currentMovieValue) {
      this.apiService.startRatingSession(currentMovieValue.id).pipe(
        tap(() => {
          this.currentView.set('rating');
        }),
        catchError(error => {
          console.error('Error starting rating session:', error);
          return of(null);
        })
      ).subscribe();
    }
  }

  setIdle(): void {
    this.apiService.setIdle().pipe(
      tap(() => {
        this.currentView.set('idle');
      }),
      catchError(error => {
        console.error('Error setting idle:', error);
        return of(null);
      })
    ).subscribe();
  }

  // Helper methods for template
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
    return this.loadingRatings().has(movieId);
  }
}