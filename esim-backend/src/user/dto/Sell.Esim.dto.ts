import { IsEmail, IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class SellEsimDto {
    @IsString()
    @IsNotEmpty()
    passportId: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    firstname: string;

    @IsString()
    @IsNotEmpty()
    lastname: string;

    @IsNumber()
    @IsNotEmpty()
    offerId: number;

    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsString()
    @IsNotEmpty()
    currency: string;
}