import { IsEmail, IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SellEsimDto {
    @ApiProperty({ example: 'P1234567' })
    @IsString()
    @IsNotEmpty()
    passportId: string;

    @ApiProperty({ example: 'client@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'Ali' })
    @IsString()
    @IsNotEmpty()
    firstname: string;

    @ApiProperty({ example: 'Ben Salah' })
    @IsString()
    @IsNotEmpty()
    lastname: string;

    @ApiProperty({ example: 101 })
    @IsNumber()
    @IsNotEmpty()
    offerId: number;

    @ApiProperty({ example: 1800, description: 'Amount in minor units' })
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @ApiProperty({ example: 'TND' })
    @IsString()
    @IsNotEmpty()
    currency: string;
}
