import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Movie {
  id: number;
  title: string;
}

export interface RatingData {
  value: number;
  userCode: string;
}

export interface MovieWithAverage extends Movie {
  average?: number;
  ratingCount?: number;
}

export interface AverageResponse {
  movieId: number;
  average: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAllMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${this.baseUrl}/movies`);
  }

  getCurrentMovie(): Observable<Movie> {
    return this.http.get<Movie>(`${this.baseUrl}/movies/current`);
  }

  getAverages(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/averages`);
  }

  submitRating(movieId: number, ratingData: RatingData): Observable<any> {
    return this.http.post(`${this.baseUrl}/ratings/${movieId}`, ratingData);
  }
  selectMovie(movieId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/select-movie/${movieId}`, {});
  }
  startRatingSession(movieId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/start-rating-session/${movieId}`, {});
  }
  setIdle(): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/idle`, {});
  }
  getNumberOfRatingsForMovie(movieId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/ratings/number/${movieId}`);
  }
}