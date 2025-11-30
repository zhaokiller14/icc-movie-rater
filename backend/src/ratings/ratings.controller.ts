import { Controller, Post, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UsersService } from '../users/users.service';
import { EventsGateway } from '../events/events.gateway';

@Controller('ratings')
export class RatingsController {
  constructor(
    private readonly ratingsService: RatingsService,
    private readonly usersService: UsersService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Post(':movieId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Param('movieId') movieId: number, @Body() createRatingDto: CreateRatingDto) {
    await this.usersService.validateCode(createRatingDto.userCode, movieId);
    const rating = await this.ratingsService.create(movieId, createRatingDto);
    const average = await this.ratingsService.getAverage(movieId);
    this.eventsGateway.broadcastRatingUpdate(movieId, average);
    return rating;
  }
}