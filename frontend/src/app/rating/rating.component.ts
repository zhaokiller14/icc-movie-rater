import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService, Movie, RatingData } from '../services/api.service';
import { SocketService } from '../services/socket.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule]
})
export class RatingComponent implements OnInit, OnDestroy {
  // State
  rating = signal(0);
  hoveredRating = signal(0);
  currentMovie = signal<Movie | null>(null);
  isSubmitting = signal(false);
  hasSubmitted = signal(false);
  hasAlreadyRated = signal(false);
  ratingCount = signal(0);
  userCode = signal('');
  posterUrl = signal('');
  
  
  // This is the SINGLE source of truth for which screen to show
currentView = signal<'idle' | 'rating' | 'submitted' | 'waiting'>('waiting');
  private socketService = inject(SocketService);
  private apiService = inject(ApiService);

  constructor(private route: ActivatedRoute, private router: Router) {}

ngOnInit(): void {
    const code = localStorage.getItem('userCode');
    if (!code) {
      this.router.navigate(['/']);
      return;
    }
    this.userCode.set(code);
    history.pushState(null, '', '/rating');

    this.socketService.connect();
    this.setupSocketListeners();
    
    // Load movie FIRST, then determine view
    this.apiService.getCurrentMovie().subscribe({
      next: (movie) => {
        this.currentMovie.set(movie);
        if (movie) {
          this.loadRatingCount(movie.id);
        }
        this.determineInitialView(code);
      },
      error: () => {
        this.currentMovie.set(null);
        this.determineInitialView(code);
      }
    });
  }

  private determineInitialView(code: string): void {
    this.apiService.isRatingSessionActive().subscribe({
      next: ({ isActive }) => {
        if (isActive) {
          // Rating session is active — load current movie and decide if user can rate
          this.apiService.getCurrentMovie().subscribe({
            next: (movie) => {
              this.currentMovie.set(movie);
              this.posterUrl.set('/posters/' + movie.id + '.jpg');
              if (!movie) {
                this.currentView.set('waiting');
                return;
              }

              this.loadRatingCount(movie.id);
              
              // Check if user has already rated this movie
              this.apiService.userHasRated(code, movie.id).subscribe({
                next: (hasRated) => {
                  if (hasRated) {
                    this.hasAlreadyRated.set(true);
                    this.hasSubmitted.set(true);
                    this.currentView.set('submitted');
                  } else {
                    
                    this.currentView.set('rating');
                  }
                },
                error: () => {
                  // On error assume they can rate
                  this.currentView.set('rating');
                }
              });
            },
            error: () => {
              this.currentView.set('idle');
            }
          });
        } else {
          // No active session — show idle/waiting state depending on current movie
          this.apiService.getCurrentMovie().subscribe({
            next: (movie) => {
              this.currentMovie.set(movie);
              if (!movie) {
                this.currentView.set('waiting');
                return;
              }

              this.loadRatingCount(movie.id);
              // When not active, show idle but still check if user already rated for that movie
              this.apiService.userHasRated(code, movie.id).subscribe({
                next: (hasRated) => {
                  if (hasRated) {
                    this.hasAlreadyRated.set(true);
                    this.hasSubmitted.set(true);
                    this.currentView.set('submitted');
                  } else {
                    this.currentView.set('idle');
                  }
                },
                error: () => {
                  this.currentView.set('idle');
                }
              });
            },
            error: () => {
              this.currentView.set('idle');
            }
          });
        }
      },
      error: () => {
        // On error, fall back to idle
        this.currentView.set('idle');
      }
    });
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  private setupSocketListeners(): void {
    // Admin selected a movie → go to idle (waiting for rating period)
    this.socketService.onMovieSelected(() => {
      this.currentView.set('idle');
      this.loadCurrentMovie();
      this.resetRatingState();
    });

    // Admin started rating period
this.socketService.onStartRatingSession(() => {
  this.apiService.getCurrentMovie().subscribe({
      next: (movie) => {
        this.currentMovie.set(movie);
        this.loadRatingCount(movie.id);
      },
      error: () => {
        this.currentMovie.set(null);
      }
    });
      this.apiService.userHasRated(this.userCode(), this.currentMovie()?.id!).subscribe({
        next: (hasRated) => {
          if (hasRated) {
            this.hasAlreadyRated.set(true);
            this.hasSubmitted.set(true);
            this.currentView.set('submitted');
          } else {
            this.resetRatingState();
            this.posterUrl.set('/posters/' + this.currentMovie()?.id + '.jpg');
            this.currentView.set('rating');
          }
        },
        error: () => {
          // SAFE fallback: assume already rated
          this.hasAlreadyRated.set(true);
          this.hasSubmitted.set(true);
          this.currentView.set('submitted');
        }
      });
    });


    // Admin went back to idle screen
    this.socketService.onIdle(() => {
      this.currentView.set('idle');
      this.currentMovie.set(null);
      this.resetRatingState();
    });

    // Real-time rating count update
    this.socketService.onRatingCountUpdate((movieId: number, count: number) => {
      if (this.currentMovie()?.id === movieId) {
        this.ratingCount.set(count);
      }
    });
  }

  private resetRatingState(): void {
    this.hasSubmitted.set(false);
    this.hasAlreadyRated.set(false);
    this.rating.set(0);
    this.hoveredRating.set(0);
    this.ratingCount.set(0);
  }

  private loadCurrentMovie(): void {
    this.apiService.getCurrentMovie().subscribe({
      next: (movie) => {
        this.currentMovie.set(movie);
        if (movie) {
          this.loadRatingCount(movie.id);
        }
      },
      error: () => {
        this.currentMovie.set(null);
      }
    });
  }

  private loadRatingCount(movieId: number): void {
    this.apiService.getNumberOfRatingsForMovie(movieId).subscribe({
      next: (count) => this.ratingCount.set(count),
      error: () => this.ratingCount.set(0)
    });
  }

  handleSubmit(): void {
    if (this.hasAlreadyRated() || this.rating() === 0 || !this.currentMovie()) return;

    this.isSubmitting.set(true);
    const ratingData: RatingData = {
      value: this.rating(),
      userCode: this.userCode()
    };

    this.apiService.submitRating(this.currentMovie()!.id, ratingData).subscribe({
      next: () => {
        this.hasSubmitted.set(true);
        this.hasAlreadyRated.set(true);
        this.isSubmitting.set(false);
        this.currentView.set('submitted'); // Switch to submitted screen
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.status === 400 && err.error?.message?.includes('already rated')) {
          this.hasAlreadyRated.set(true);
          this.currentView.set('submitted');
        } else {
          alert('Submission failed. Try again.');
        }
      }
    });
  }

  // Star interaction
  setRating(value: number): void {
    if (!this.hasAlreadyRated()) this.rating.set(value);
  }
  setHoveredRating(value: number): void {
    if (!this.hasAlreadyRated()) this.hoveredRating.set(value);
  }
  clearHoveredRating(): void {
    if (!this.hasAlreadyRated()) this.hoveredRating.set(0);
  }

  getStarState(starIndex: number): 'full' | 'half' | 'empty' {
    if (this.hasAlreadyRated()) return 'empty';
    const effective = this.hoveredRating() || this.rating();
    if (effective >= starIndex) return 'full';
    if (effective === starIndex - 0.5) return 'half';
    return 'empty';
  }

}