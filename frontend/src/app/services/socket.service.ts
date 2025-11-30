import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private baseUrl = environment.apiUrl;

  connect(): void {
    if (!this.socket) {
      this.socket = io(this.baseUrl, {
        transports: ['websocket','polling'],
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onNewMovie(callback: (movieId: number) => void): void {
    if (this.socket) {
      this.socket.on('newMovie', (data: { movieId: number }) => {
        callback(data.movieId);
      });
    }
  }

  onIdle(callback: () => void): void {
    if (this.socket) {
      this.socket.on('idle', callback);
    }
  }

  onRatingUpdate(callback: (movieId: number, average: number) => void): void {
    if (this.socket) {
      this.socket.on('ratingUpdate', (data: { movieId: number; average: number }) => {
        callback(data.movieId, data.average);
      });
    }
  }
  onRatingCountUpdate(callback: (movieId: number, ratingCount: number) => void): void {
    if (this.socket) {
      this.socket.on('ratingCountUpdate', (data: { movieId: number; ratingCount: number }) => {
        callback(data.movieId, data.ratingCount);
      });
    }
  }
 
  getSocket(): Socket | null {
    return this.socket;
  }
}