import { Injectable } from '@nestjs/common';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferRepository } from './offer.repository';

@Injectable()
export class OfferService {
  constructor(private readonly OfferRepository: OfferRepository) { }
  create(dto: CreateOfferDto) {
    return this.OfferRepository.create(dto);
  }

  findbyId(id: number) {
    return this.OfferRepository.findbyId(id)
  }


}
