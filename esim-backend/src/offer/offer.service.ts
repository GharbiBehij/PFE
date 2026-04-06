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
  update(id: number, dto: UpdateOfferDto) {
    return this.OfferRepository.update(id, dto)
  }
  delete(id: number) {
    return this.OfferRepository.update(id, { isDeleted: true })
  }

  findbyId(id: number) {
    return this.OfferRepository.findbyId(id)
  }
  findAll() {
    return this.OfferRepository.findAll()
  }
  findByCountry(country: string) {
    return this.OfferRepository.findByCountry(country)
  }
  findPopular() {
    return this.OfferRepository.findPopular()
  }
  search(query: string) {
    return this.OfferRepository.search(query)
  }
  findDestinations() {
    return this.OfferRepository.findDestinations()
  }
     
}
