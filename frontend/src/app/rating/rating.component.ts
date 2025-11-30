import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService, Movie, RatingData } from '../services/api.service';
import { SocketService } from '../services/socket.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule]
})
export class RatingComponent implements OnInit, OnDestroy {
  rating: number = 0;
  hoveredRating: number = 0;
  currentMovie: Movie | null = null;
  isSubmitting: boolean = false;
  hasSubmitted: boolean = false;
  ratingCount: number = 0;
  userCode: string = '';

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const codeFromUrl = params['code'];
      if (codeFromUrl) {
        this.userCode = codeFromUrl;
      }
    });

    this.socketService.connect();

    this.socketService.onNewMovie(() => {
      this.loadCurrentMovie();
      this.resetSubmissionState();
    });
    
    this.socketService.onIdle(() => {
      this.rating = 0;
      this.hoveredRating = 0;
      this.currentMovie = null;
      this.resetSubmissionState();
    });

    this.loadCurrentMovie();
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  private resetSubmissionState(): void {
    this.hasSubmitted = false;
    this.ratingCount = 0;
  }

  private loadCurrentMovie(): void {
    this.apiService.getCurrentMovie().subscribe({
      next: (movie: Movie) => {
        this.currentMovie = movie;
        if (movie) {
          this.loadRatingCount(movie.id);
        }
      },
      error: (error) => {
        console.error('Error loading current movie:', error);
        this.currentMovie = null;
        this.ratingCount = 0;
      }
    });
  }

  private loadRatingCount(movieId: number): void {
    this.apiService.getNumberOfRatingsForMovie(movieId).subscribe({
      next: (count: number) => {
        this.ratingCount = count;
      },
      error: (error) => {
        console.error('Error loading rating count:', error);
        this.ratingCount = 0;
      }
    });
  }

  handleSubmit(): void {
    if (this.rating > 0 && this.userCode && this.currentMovie) {
      this.isSubmitting = true;
      const ratingData: RatingData = {
        value: this.rating,
        userCode: this.userCode
      };

      this.apiService.submitRating(this.currentMovie.id, ratingData).subscribe({
        next: () => {
          console.log(`Rating ${this.rating} submitted successfully for movie ${this.currentMovie?.title}`);
          this.hasSubmitted = true;
          this.isSubmitting = false;
          // Update the rating count after submission
          this.loadRatingCount(this.currentMovie!.id);
        },
        error: (error) => {
          console.error('Failed to submit rating:', error);
          this.isSubmitting = false;
        }
      });
    } else {
      if (!this.userCode) {
        alert('Please enter your event code before submitting.');
      } else if (!this.currentMovie) {
        alert('No movie selected to rate.');
      } else if (this.rating === 0) {
        alert('Please select a rating.');
      }
    }
  }

  setRating(value: number): void {
    this.rating = value;
  }

  setHoveredRating(value: number): void {
    this.hoveredRating = value;
  }

  clearHoveredRating(): void {
    this.hoveredRating = 0;
  }

  getStarState(starIndex: number): 'full' | 'half' | 'empty' {
    const effectiveRating = this.hoveredRating || this.rating;
    if (effectiveRating >= starIndex) {
      return 'full';
    } else if (effectiveRating === starIndex - 0.5) {
      return 'half';
    }
    return 'empty';
  }

  setUserCode(code: string): void {
    this.userCode = code;
  }
}