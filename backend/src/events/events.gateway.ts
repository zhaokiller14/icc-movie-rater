import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'https://icc-movie-rating.azurewebsites.net',
    credentials: true
  },
  transports: ['websocket', 'polling'],  // Important for Azure
  allowEIO3: true  // For Socket.io v2/v3 compatibility
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  broadcastMovieSelected(movieId: number) {
    this.server.emit('movieSelected', { movieId });
  }
  broadcastStartRatingSession(movieId: number) {
    this.server.emit('startRatingSession', { movieId });
  }

  broadcastIdle() {
    this.server.emit('idle');
  }

  broadcastRatingUpdate(movieId: number, average: number) {
    this.server.emit('ratingUpdate', { movieId, average });
  }
  broadcastRatingCountUpdate(movieId: number, ratingCount: number) {
  this.server.emit('ratingCountUpdate', { movieId, ratingCount });
}
  broadcastRatingClear() {
    this.server.emit('ratingClear');
  }}