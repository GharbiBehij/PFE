import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, UseGuards, Req } from '@nestjs/common';
import { userService } from './user.service';
import { CreateUserDto } from './dto/Create.User.dto';
import { SellEsimDto } from './dto/Sell.Esim.dto';

@Controller('user')
export class userController {
  constructor(private readonly userService: userService) { }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
  @Post()
  async Sell(@Body() dto: SellEsimDto, userId: number) {
    return this.userService.sellEsim(dto, userId)
  }

}
