import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { UserCode } from './entities/user-code.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserCode)
    private userCodeRepo: Repository<UserCode>,
  ) {}

  async generateCodes(count: number): Promise<string[]> {
    const codes : string [] = [];
    for (let i = 0; i < count; i++) {
      let code: string;
      do {
        code = Math.random().toString(36).substring(2, 5).toUpperCase();
      } while (await this.userCodeRepo.findOne({ where: { code } }));
      const newCode = this.userCodeRepo.create({ code, ratedMovies: [] });
      await this.userCodeRepo.save(newCode);
      codes.push(code);
    }
    return codes;
  }

async validateCode(code: string, movieId: number): Promise<void> {
  const userCode = await this.userCodeRepo.findOne({ where: { code } });
  if (!userCode) {
    throw new BadRequestException('Invalid code');
  }
  
  // Check if user has already rated this movie
  if (userCode.ratedMovies.includes(movieId)) {
    throw new BadRequestException('Already rated this movie');
  }
}

// Add this method to mark a movie as rated after successful rating creation
async markMovieAsRated(code: string, movieId: number): Promise<void> {
  const userCode = await this.userCodeRepo.findOne({ where: { code } });
  if (userCode && !userCode.ratedMovies.includes(movieId)) {
    userCode.ratedMovies.push(movieId);
    await this.userCodeRepo.save(userCode);
  }
}
  async getTotalCodes(): Promise<number> {
    return this.userCodeRepo.count();
  }
async getUsedCodesCount(): Promise<number> {
  const allCodes = await this.userCodeRepo.find();
  const usedCodes = allCodes.filter(code => 
    code.ratedMovies && code.ratedMovies.length > 0
  );
  return usedCodes.length;
}

async getUsedCodesList(): Promise<UserCode[]> {
  const allCodes = await this.userCodeRepo.find();
  return allCodes.filter(code => 
    code.ratedMovies && code.ratedMovies.length > 0
  );
}


  async clearAllCodes(): Promise<void> {
    await this.userCodeRepo.delete({});
  }

  async getAllCodes(): Promise<UserCode[]> {
    return this.userCodeRepo.find();
  }
  async getCodeRatedMovies(code: string): Promise<number[]> {
    const userCode = await this.userCodeRepo.findOne({ where: { code } });
    if (!userCode) {
      throw new BadRequestException('Invalid code');
    }
    return userCode.ratedMovies || [];
  }
  async clearRatedMovies(): Promise<void> {
    const allCodes = await this.userCodeRepo.find();
    for (const code of allCodes) {
      code.ratedMovies = [];
      await this.userCodeRepo.save(code);
    }
  }
}