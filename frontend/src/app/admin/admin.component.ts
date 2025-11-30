import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Movie } from '../services/api.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class AdminComponent implements OnInit {
  movies: Movie[] = [];
  currentMovie: Movie | null = null;
  isLoading = true;
  currentView: 'idle' | 'rating' = 'idle';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadMovies();
    this.loadCurrentMovie();
  }

  loadMovies(): void {
    this.isLoading = true;
    this.apiService.getAllMovies().subscribe({
      next: (movies) => {
        this.movies = movies;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading movies:', error);
        this.isLoading = false;
      }
    });
  }

  loadCurrentMovie(): void {
    this.apiService.getCurrentMovie().subscribe({
      next: (movie) => {
        this.currentMovie = movie;
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
}