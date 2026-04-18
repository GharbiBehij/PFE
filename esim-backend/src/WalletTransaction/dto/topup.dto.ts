import { IsNumber, IsPositive, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestTopUpDto {
    @ApiProperty({
        example: 15000,
        description: 'Top-up amount in minor units',
        minimum: 1,
        maximum: 1000000,
    })
    @IsNumber()
    @IsPositive()
    @Min(1)
    @Max(1_000_000)
    amount: number;
}

export class ApproveRejectTopUpDto {
    @ApiProperty({ example: 25 })
    @IsInt()
    topUpId: number;
}
