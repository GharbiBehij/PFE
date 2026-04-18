import { PartialType } from '@nestjs/swagger';
import { CreateOfferDto } from './create-offer.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOfferDto extends PartialType(CreateOfferDto) {
	@ApiPropertyOptional({ example: true })
	isDeleted?: boolean;
}
