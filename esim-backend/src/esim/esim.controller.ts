import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EsimService } from './esim.service';
import { CreateEsimDto } from './adapters/create-esim.dto';
import { UpdateEsimDto } from './dto/update-esim.dto';

@Controller('esim')
export class EsimController {
  constructor(private readonly esimService: EsimService) { }

  @Post()
  create(@Body() createEsimDto: CreateEsimDto, userId: number, salesmanId: number, transactionId: number) {
    return this.esimService.create(createEsimDto, userId, salesmanId, transactionId,);
  }

  @Get()
  findAll() {
    return this.esimService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.esimService.findOne(+id);
  }

  @Patch(':id')
  UpdateEsim(@Param('id') id: string, @Body() updateEsimDto: UpdateEsimDto) {
    return this.esimService.UpdateEsim(+id, updateEsimDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.esimService.remove(+id);
  }
}
