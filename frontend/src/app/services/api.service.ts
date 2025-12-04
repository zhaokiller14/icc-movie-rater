import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../environment/environment';
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
  private readonly baseUrl = environment.apiUrl;

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
  isAdmin(code: string): Observable<{ isAdmin: boolean }> {
    return this.http.get<{ isAdmin: boolean }>(`${this.baseUrl}/users/is-admin/${code}`);
  }
  isValidUserCode(code: string): Observable<{ isValid: boolean }> {
    return this.http.get<{ isValid: boolean }>(`${this.baseUrl}/users/is-valid/${code}`);
  }

  isRatingSessionActive() : Observable< {isActive : boolean}> {
    return this.http.get<{ isActive:boolean}>(`${this.baseUrl}/admin/is-active/`);
  }
userHasRated(code: string, movieId: number): Observable<boolean> {
  return this.http
    .get<{ userRatedMovies: number[] }>(`${this.baseUrl}/users/rated-movies/${code}`)
    .pipe(
      tap(res => console.log('User rated movies:', res.userRatedMovies, 'includes movieId:', res.userRatedMovies.includes(movieId))),
      
      map(res => res.userRatedMovies?.includes(movieId) ?? false),
      // NEVER silently return false on error!
      catchError(err => {
        console.error('Failed to check if user has rated:', err);
        // Re-throw so the component knows it failed
        return throwError(() => err);
      })
    );
}
}