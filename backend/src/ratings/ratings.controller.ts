import { Controller, Post, Body, Param, UsePipes, ValidationPipe, Get } from '@nestjs/common';
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
  @Post('clear')
  async clearRatings() {
    const result = await this.ratingsService.clearAllRatings();
    this.eventsGateway.broadcastRatingClear();
    return result;
  }
  @Post(':movieId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Param('movieId') movieId: number, @Body() createRatingDto: CreateRatingDto) {
    await this.usersService.validateCode(createRatingDto.userCode, movieId);
    const rating = await this.ratingsService.create(movieId, createRatingDto);
    await this.usersService.markMovieAsRated(createRatingDto.userCode, movieId);
    return rating;
  }

  @Get('number/:movieId')
  async getNumberOfRatingsForMovie(@Param('movieId') movieId: number) {
    return this.ratingsService.getNumberOfRatingsForMovie(movieId);
  }

}