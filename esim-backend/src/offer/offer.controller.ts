import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  OfferResponseDto,
} from './dto/offer-response.dto';
import { ErrorResponseDto } from '../Common/dto/error-response.dto';
import { DestinationResponseDto } from '../esim/dto/destination-response.dto';
import { EsimService } from '../esim/esim.service';

@ApiTags('offers')
@Controller('offers')
export class OfferController {
  constructor(
    private readonly offerService: OfferService,
    private readonly esimService: EsimService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new offer' })
  @ApiResponse({ status: 201, type: OfferResponseDto })
  create(@Body() createOfferDto: CreateOfferDto) {
    return this.offerService.create(createOfferDto);
  }

  // Static routes must come before parameterized routes
  @Get('popular')
  @ApiOperation({ summary: 'List popular offers' })
  @ApiResponse({ status: 200, type: [OfferResponseDto] })
  findPopular() {
    return this.offerService.findPopular();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search offers by destination, region, title, or description' })
  @ApiQuery({ name: 'q', required: true, example: 'France' })
  @ApiResponse({ status: 200, type: [OfferResponseDto] })
  search(@Query('q') q: string) {
    return this.offerService.search(q);
  }

  @Get('destinations')
  @ApiOperation({ summary: 'Get destination list with aggregated pricing metadata' })
  @ApiResponse({ status: 200, type: [DestinationResponseDto] })
  findDestinations() {
    return this.esimService.getDestinations();
  }

  @Get()
  @ApiOperation({ summary: 'List all offers or filter by country' })
  @ApiQuery({ name: 'country', required: false, example: 'France' })
  @ApiResponse({ status: 200, type: [OfferResponseDto] })
  findAll(@Query('country') country?: string) {
    if (country) return this.offerService.findByCountry(country);
    return this.offerService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get offer by id' })
  @ApiParam({ name: 'id', type: Number, example: 101 })
  @ApiResponse({ status: 200, type: OfferResponseDto })
  @ApiResponse({ status: 404, description: 'Offer not found', type: ErrorResponseDto })
  findbyId(@Param('id') id: string) {
    return this.offerService.findbyId(+id);
  }
}
