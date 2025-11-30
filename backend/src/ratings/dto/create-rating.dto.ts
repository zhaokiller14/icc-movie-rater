import { IsNumber, Min, Max, IsString } from 'class-validator';

export class CreateRatingDto {
  @IsNumber()
  @Min(0.5)
  @Max(5)
  value: number;

  @IsString()
  userCode: string;
}