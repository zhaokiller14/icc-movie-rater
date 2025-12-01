import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService, Movie, RatingData } from '../services/api.service';
import { SocketService } from '../services/socket.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { HostListener } from '@angular/core';

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
  hasAlreadyRated = signal(false); // New signal to track if user already rated
  ratingCount = signal(0);
  userCode = signal('');
  currentView = signal<'idle' | 'rating'>('idle');

  private routeParams!: () => Params;
  private socketService = inject(SocketService);
  private apiService = inject(ApiService);

  constructor(private route: ActivatedRoute, private router: Router) {
    this.routeParams = toSignal(this.route.queryParams, { initialValue: {} as Params });
  }

@HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent) {
    const code = localStorage.getItem('userCode');
    if (code) {
      // Prevent back navigation by pushing the current state
      history.pushState(null, '', `/rating?code=${code}`);
      this.router.navigate(['/rating'], { queryParams: { code } });
    } else {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    const code = localStorage.getItem('userCode');
    if (!code) {
      this.router.navigate(['/']);
      return;
    }
    this.userCode.set(code);

    // Push current state to prevent back navigation
    history.pushState(null, '', `/rating?code=${code}`);

    this.socketService.connect();
    this.setupSocketListeners();
    this.loadCurrentMovie();
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  private setupSocketListeners(): void {
    // Listen for new movie selections
    this.socketService.onNewMovie(() => {
      this.currentView.set('rating');
      this.loadCurrentMovie();
      this.resetSubmissionState();
    });
    
    // Listen for idle state
    this.socketService.onIdle(() => {
      this.currentView.set('idle');
      this.rating.set(0);
      this.hoveredRating.set(0);
      this.currentMovie.set(null);
      this.resetSubmissionState();
    });

    // Listen for rating count updates
    this.socketService.onRatingCountUpdate((movieId: number, ratingCount: number) => {
      this.handleRatingCountUpdate(movieId, ratingCount);
    });
  }

  private resetSubmissionState(): void {
    this.hasSubmitted.set(false);
    this.hasAlreadyRated.set(false);
    this.ratingCount.set(0);
    this.rating.set(0);
    this.hoveredRating.set(0);
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

  private handleRatingCountUpdate(movieId: number, ratingCount: number): void {
    const currentMovie = this.currentMovie();
    if (currentMovie && currentMovie.id === movieId) {
      this.ratingCount.set(ratingCount);
    }
  }

  handleSubmit(): void {
    const currentRating = this.rating();
    const currentUserCode = this.userCode();
    const currentMovie = this.currentMovie();

    if (this.hasAlreadyRated()) {
      alert('You have already rated this movie.');
      return;
    }

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
          this.hasAlreadyRated.set(true);
          this.isSubmitting.set(false);
        },
        error: (error) => {
          console.error('Failed to submit rating:', error);
          this.isSubmitting.set(false);
          
          // Handle specific error cases
          if (error.status === 400 && error.error?.message?.includes('already rated')) {
            this.hasAlreadyRated.set(true);
            this.hasSubmitted.set(true);
            alert('You have already rated this movie.');
          } else {
            alert('Failed to submit rating. Please try again.');
          }
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
    if (!this.hasAlreadyRated()) {
      this.rating.set(value);
    }
  }

  setHoveredRating(value: number): void {
    if (!this.hasAlreadyRated()) {
      this.hoveredRating.set(value);
    }
  }

  clearHoveredRating(): void {
    if (!this.hasAlreadyRated()) {
      this.hoveredRating.set(0);
    }
  }

  getStarState(starIndex: number): 'full' | 'half' | 'empty' {
    if (this.hasAlreadyRated()) {
      return 'empty'; // Don't show hover effects if already rated
    }
    
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