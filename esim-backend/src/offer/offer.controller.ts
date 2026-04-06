import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { OfferService } from './offer.service';
import type { CreateOfferDto } from './dto/create-offer.dto';

@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) { }

  @Post()
  create(@Body() createOfferDto: CreateOfferDto) {
    return this.offerService.create(createOfferDto);
  }

  // Static routes must come before parameterized routes
  @Get('popular')
  findPopular() {
    return this.offerService.findPopular();
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.offerService.search(q);
  }

  @Get('destinations')
  findDestinations() {
    return this.offerService.findDestinations();
  }

  @Get()
  findAll(@Query('country') country?: string) {
    if (country) return this.offerService.findByCountry(country);
    return this.offerService.findAll();
  }

  @Get(':id')
  findbyId(@Param('id') id: string) {
    return this.offerService.findbyId(+id);
  }
}
