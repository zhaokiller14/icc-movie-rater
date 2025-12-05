import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class UserCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 6 })
  code: string;

  @Column('simple-array', { nullable: true }) // Array of movie IDs rated
  ratedMovies: number[];


  @Column({ default: false })
  isAdmin: boolean;
}