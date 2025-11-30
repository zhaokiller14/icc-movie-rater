import { IsString } from 'class-validator';

export class CreateMovieDto {
  @IsString()
  title: string;
}