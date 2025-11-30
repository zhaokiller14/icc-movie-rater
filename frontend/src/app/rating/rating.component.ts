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

  // bound to the input in the template
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

  this.socketService.onNewMovie(() => this.loadCurrentMovie());
  this.socketService.onIdle(() => {
    this.rating = 0;
    this.hoveredRating = 0;
    this.currentMovie = null;
  });

  this.loadCurrentMovie();
}


  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  private loadCurrentMovie(): void {
    this.apiService.getCurrentMovie().subscribe({
      next: (movie: Movie) => {
        this.currentMovie = movie;
      },
      error: (error) => {
        console.error('Error loading current movie:', error);
        this.currentMovie = null;
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

      // Use the current movie's id instead of hardcoded 0
      this.apiService.submitRating(this.currentMovie.id, ratingData).subscribe({
        next: () => {
          console.log(`Rating ${this.rating} submitted successfully for movie ${this.currentMovie?.title}`);
          this.rating = 0; // Clear the rating after successful submission
          this.hoveredRating = 0;
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Failed to submit rating:', error);
          this.isSubmitting = false;
          // Optionally show an error message to the user
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

  // if you want to set code programmatically:
  setUserCode(code: string): void {
    this.userCode = code;
  }
}
