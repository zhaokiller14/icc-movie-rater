import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Movie } from '../../movies/entities/movie.entity';

@Entity()
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 2, scale: 1 }) // 0.5 to 5.0
  value: number;

  @ManyToOne(() => Movie, movie => movie.id)
  movie: Movie;

  @Column()
  userCode: string; // Tie to user's code
}