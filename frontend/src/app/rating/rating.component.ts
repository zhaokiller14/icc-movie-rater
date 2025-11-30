import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService, Movie, RatingData } from '../services/api.service';
import { SocketService } from '../services/socket.service';
import { ActivatedRoute, Params } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule]
})
export class RatingComponent implements OnInit, OnDestroy {
  // Signals for local state
  rating = signal(0);
  hoveredRating = signal(0);
  currentMovie = signal<Movie | null>(null);
  isSubmitting = signal(false);
  hasSubmitted = signal(false);
  ratingCount = signal(0);
  userCode = signal('');

private routeParams!: () => Params;

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    private route: ActivatedRoute
  ) {
    this.routeParams = toSignal(this.route.queryParams, { initialValue: {} as Params });
  }

  ngOnInit(): void {
    // Set user code from URL
    const codeFromUrl = this.routeParams()['code'];
    if (codeFromUrl) {
      this.userCode.set(codeFromUrl);
    }

    this.socketService.connect();

    this.socketService.onNewMovie(() => {
      this.loadCurrentMovie();
      this.resetSubmissionState();
    });
    
    this.socketService.onIdle(() => {
      this.rating.set(0);
      this.hoveredRating.set(0);
      this.currentMovie.set(null);
      this.resetSubmissionState();
    });

    this.loadCurrentMovie();
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  private resetSubmissionState(): void {
    this.hasSubmitted.set(false);
    this.ratingCount.set(0);
  }

  private loadCurrentMovie(): void {
    this.apiService.getCurrentMovie().subscribe({
      next: (movie: Movie) => {
        this.currentMovie.set(movie);
        if (movie) {
          this.loadRatingCount(movie.id);
        }
      },
      error: (error) => {
        console.error('Error loading current movie:', error);
        this.currentMovie.set(null);
        this.ratingCount.set(0);
      }
    });
  }

  private loadRatingCount(movieId: number): void {
    this.apiService.getNumberOfRatingsForMovie(movieId).subscribe({
      next: (count: number) => {
        this.ratingCount.set(count);
      },
      error: (error) => {
        console.error('Error loading rating count:', error);
        this.ratingCount.set(0);
      }
    });
  }

  handleSubmit(): void {
    const currentRating = this.rating();
    const currentUserCode = this.userCode();
    const currentMovie = this.currentMovie();

    if (currentRating > 0 && currentUserCode && currentMovie) {
      this.isSubmitting.set(true);
      const ratingData: RatingData = {
        value: currentRating,
        userCode: currentUserCode
      };

      this.apiService.submitRating(currentMovie.id, ratingData).subscribe({
        next: () => {
          console.log(`Rating ${currentRating} submitted successfully for movie ${currentMovie.title}`);
          this.hasSubmitted.set(true);
          this.isSubmitting.set(false);
          this.loadRatingCount(currentMovie.id);
        },
        error: (error) => {
          console.error('Failed to submit rating:', error);
          this.isSubmitting.set(false);
        }
      });
    } else {
      if (!currentUserCode) {
        alert('Please enter your event code before submitting.');
      } else if (!currentMovie) {
        alert('No movie selected to rate.');
      } else if (currentRating === 0) {
        alert('Please select a rating.');
      }
    }
  }

  setRating(value: number): void {
    this.rating.set(value);
  }

  setHoveredRating(value: number): void {
    this.hoveredRating.set(value);
  }

  clearHoveredRating(): void {
    this.hoveredRating.set(0);
  }

  getStarState(starIndex: number): 'full' | 'half' | 'empty' {
    const effectiveRating = this.hoveredRating() || this.rating();
    if (effectiveRating >= starIndex) {
      return 'full';
    } else if (effectiveRating === starIndex - 0.5) {
      return 'half';
    }
    return 'empty';
  }

  setUserCode(code: string): void {
    this.userCode.set(code);
  }
}